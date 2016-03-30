/*__________________________________________

          AUTHENTICATION SERVICES
  __________________________________________*/

app.service('SessionSvc', ['$rootScope', 'AUTH', 'UsersSvc', 'sessionStore',
                          function($rootScope, AUTH, UsersSvc, store) {
  var self        = this;
  var currentUser = null;

  $rootScope.$on(AUTH.loginSuccess, function(events, user) {
    self.setCurrentUser(user);
  });

  $rootScope.$on(AUTH.logoutSuccess, function() {
    self.destroy();
  });

  self.setCurrentUser = function(user) {
    store.setData('currentUser', user);
  };

  self.getCurrentUser = function() {
    currentUser = store.getData('currentUser');
    return currentUser;
  };

  self.destroy = function() {
    self.currentUser = null;
    store.deleteData('currentUser');
    store.deleteData('accessKeys');
  };
}]);
app.service('AuthenticationSvc', ['$rootScope', 'AUTH', 'ROUTES', 'SessionSvc',
  'sessionStore', 'AccessToken', '$log', function($rootScope, AUTH, ROUTES,
  Session, store, AccessToken, $log) {
  var self  = this;

  self.login = function(credentials, success, failure) {
    /*First authenticate the user against server database.*/
    AccessToken.getFor({
      username: credentials.handle,
      password: credentials.password
    }, function(tokens) {
      $rootScope.$broadcast(AUTH.authenticated);
      /*Second, get the metadata of the user who was granted access to API.*/
      AccessToken.getUser({token: tokens.access_token}, function(user) {
        if (!!user.activated) {
          Session.setCurrentUser(user);
          store.setData('accessKeys', tokens);
          $rootScope.$broadcast(AUTH.loginSuccess, user);
          success(user);
        } else {
          $rootScope.$broadcast(AUTH.mustActivateAccount, user);
          failure('mustActivateAccount');
        }
      }, function(err) {
        $rootScope.$broadcast(AUTH.loginFailed);
        failure(err);
      });
    }, function(err) {
      $rootScope.$broadcast(AUTH.notAuthenticated);
      failure(err);
    });
  };

  self.logout = function(callback) {
    var accessKeys    = store.getData('accessKeys');
    var refreshToken  = accessKeys ? accessKeys.refresh_token : null;

    AccessToken.revoke({token_type_hint: 'refresh_token', token: refreshToken}, function() {
      Session.destroy();
      callback(true);
    }, function(err) {
      if (err.error_description === 'invalid token') {
        Session.destroy();
        callback(true);
      }
    });

    callback(false);
  };

  self.isAuthenticated = function() {
    if (Session.getCurrentUser() && Session.getCurrentUser()._id) {
      $rootScope.$broadcast(AUTH.authenticated);
      return true;
    }
    $rootScope.$broadcast(AUTH.notAuthenticated);
    return false;
  };

  self.authorize = function(loginRequired) {
    var result = AUTH.authorized;
    var logged = self.isAuthenticated();

    if (!!loginRequired && !!!logged) {
      result = AUTH.mustLogIn;
    }
    return result;
  };
}]);

/*________________________________________________________

               APP RESOURCE SERVICE WRAPPERS
  ________________________________________________________*/

app.service('UsersSvc', ['Users', 'MessageSvc', '$log', '$location',
'$rootScope', function(Users, MessageSvc, $log, $location, $rootScope) {
  var self = this;
  self.create = function(user, success, failure) {
    var newUser = new Users();
    for (var key in user) {
      newUser[key] = user[key];
    }
    newUser.$save(function(savedUser) {
      success(savedUser);
    }, function(err) {
      failure(err);
    });
  };

  self.delete = function(user, success, failure) {
    Users.delete({id: user._id}, function(data) {
      return success(data);
    }, function(error) {
      return failure(error);
    });
  };

  self.update = function(user, success, failure) {
    Users.get({id: user._id}, function(userToUpdate) {
      for (var key in userToUpdate) {
        if (!!user[key] && userToUpdate[key] !== user[key]) {
          userToUpdate[key] = user[key];
        }
      }
      if (!!user.avatar) {
        userToUpdate.avatar = user.avatar;
        delete userToUpdate.avatarUrl;
      }
      userToUpdate.$update(function(updatedUser) {
        return success(updatedUser);
      }, function(err) {
        $log.error('Profile update failed: ' + err);
        return failure(err);
      });
    });
  };

  self.get = function(id, success, failure) {
    Users.get({id: id}, function(user) {
      if (!!user.avatarUrl &&
        (user.avatarUrl.search('user-avatar-placeholder') === -1)) {
        user.avatarUrl = '../../' +
          user.avatarUrl.split('/').slice(1).join('/');
      }
      success(user);
    }, function(err) {
      failure(err);
    });
  };

  self.all = Users.query(function(collection) {
    var ret = [];
    angular.forEach(collection, function(item) {
      if (!!item.avatarUrl &&
        (item.avatarUrl.search('user-avatar-placeholder') === -1)) {
        item.avatarUrl = '../../' +
          item.avatarUrl.split('/').slice(1).join('/');
      }
      this.push(item);
    }, ret);
    return ret;
  }, function(err) {
    $log.debug('Unable to get all the users!');
  });

  self.findByHandle = function(handle, success, failure) {
    return Users.find({handle: handle}, function(user) {
      success(user);
    }, function(err) {
      failure(err);
    });
  };
}]);
app.service('AlbumsSvc', ['Albums', '$log', function(Albums, $log) {
  var self = this;

  self.create = function(data, success, failure) {
    var newAlbum = new Albums(
      {
        title:         data.title,
        coverArt:      data.coverArt,
        artistId:      data.artist.id,
        releaseDate:   data.releaseDate
      }
    );
    newAlbum.$save(function(savedAlbum) {
      success(savedAlbum);
    }, function(err) {
      failure(err);
    });
  };

  self.update = function(album, success, failure) {
    Albums.get({id: album._id}, function(albumToUpdate) {
      for (var key in albumToUpdate) {
        if (!!album[key] && albumToUpdate[key] !== album[key]) {
          albumToUpdate[key] = album[key];
        }
      }
      if (album.coverArt) {
        albumToUpdate.coverArt = album.coverArt;
      }

      albumToUpdate.$update(function(updatedAlbum) {
        success(updatedAlbum);
      }, function(err) {
        failure(err);
      });
    });
  };

  self.get = function(albumId, success, failure) {
    Albums.get({id: albumId}, function(data) {
      data.artist = {id: data.artistId};
      delete data.artistId;
      data.releaseDate = new Date(data.releaseDate);  // AngularJs 1.3+ only accept valid Date format and not string equilavent
      if (!!data.imageUrl &&
        (data.imageUrl.search('album-coverart-placeholder') === -1)) {
        data.imageUrl = '../../' + data.imageUrl.split('/').slice(1).join('/');
      }
      success(data);
    }, function(err) {
      failure(err);
    });
  };

  self.all = Albums.query(function(collection) {
    var ret = [];
    angular.forEach(collection, function(item) {
      item.artist = {id: item.artistId};
      delete item.artistId;
      item.releaseDate = new Date(item.releaseDate);  // AngularJs 1.3+ only accept valid Date format and not string equilavent
      if (!!item.imageUrl &&
        (item.imageUrl.search('album-coverart-placeholder') === -1)) {
        item.imageUrl = '../../' + item.imageUrl.split('/').slice(1).join('/');
      }
      this.push(item);
    }, ret);
    return ret;
  }, function(err) {
    $log.debug('Unable to get all the albums!');
  });

  self.getByUser = function(user, success, failure) {
    Albums.getByUser({userId: user._id}, function(albums) {
      angular.forEach(albums, function(data) {
        data.artist = {id: data.artistId};
        delete data.artistId;
        data.releaseDate = new Date(data.releaseDate);
        if (!!data.imageUrl &&
          (data.imageUrl.search('album-coverart-placeholder') === -1)) {
          data.imageUrl = '../../' + data.imageUrl.split('/').slice(1).join('/');
        }
      });
      success(albums);
    }, function(err) {
      failure(err);
    });
  };

  self.delete = function(album, success, failure) {
    Albums.delete({id: album._id}, function(data) {
      success(data);
    }, function(err) {
      failure(err);
    });
  };
}]);
app.service('TracksSvc', ['Tracks', '$log', 'UsersSvc', 'AlbumsSvc', '$window',
'sessionStore', function(Tracks, $log, UsersSvc, AlbumsSvc, $window, store) {
  var self = this;

  self.create = function(track, success, failure) {
    var newTrack = new Tracks({
      title:        track.title,
      artistId:     track.artist.id,
      albumId:      track.album.id,
      feat:         track.feat,
      streamUrl:    track.streamUrl,
      duration:     track.duration,
      coverArt:     track.coverArt,
      imageFile:    track.imageFile,
      audioFile:    track.audioFile,
      releaseDate:  track.releaseDate,
      downloadable: track.downloadable,
      genre:        track.genre
    });

    newTrack.$save(function(savedTrack) {
      success(savedTrack);
    }, function(err) {
      failure(err);
    });
  };

  self.update = function(track, success, failure) {
    Tracks.get({id: track._id}, function(trackToUpdate) {
      for (var key in trackToUpdate) {
        if (!!track[key] && trackToUpdate[key] !== track[key]) {
          trackToUpdate[key] = track[key];
        }
      }
      trackToUpdate.albumId = track.album.id;

      if ('imageFile' in track && track.imageFile) {
        trackToUpdate.imageFile = track.imageFile;
      }

      if ('audioFile' in track && track.audioFile) {
        trackToUpdate.audioFile = track.audioFile;
      }

      trackToUpdate.$update(function(updatedTrack) {
        success(updatedTrack);
      }, function(err) {
        failure(err);
      });
    });
  };

  self.get = function(trackId, success, failure) {
    Tracks.get({id: trackId}, function(data) {
      data.artist      = {id: data.artistId};
      data.album       = {id: data.albumId};
      data.releaseDate = new Date(data.releaseDate); // AngularJs 1.3+ only accept valid Date format and not string equilavent
      delete data.artistId;
      delete data.albumId;
      if (!!data.coverArt) {
        data.coverArt = '../../' + data.coverArt.split('/').slice(1).join('/');
      }
      if (!!data.streamUrl) {
        data.streamUrl = '../../' +
          data.streamUrl.split('/').slice(1).join('/');
      }
      success(data);
    }, function(err) {
      failure(err);
    });
  };

  self.all = Tracks.query(function(collection) {
    var ret = [];
    angular.forEach(collection, function(item) {
      item.artist      = {id: item.artistId};
      item.album       = {id: item.albumId};
      item.releaseDate = new Date(item.releaseDate); // AngularJs 1.3+ only accept valid Date format and not string equilavent
      delete item.artistId;
      delete item.albumId;
      if ('coverArt' in item && !!item.coverArt) {
        item.coverArt = '../../' + item.coverArt.split('/').slice(1).join('/');
      }
      if ('streamUrl' in item && !!item.streamUrl) {
        item.streamUrl = '../../' +
          item.streamUrl.split('/').slice(1).join('/');
      }
      this.push(item);
    }, ret);
    return ret;
  }, function(err) {
    $log.debug('Unable to get all the tracks!');
  });

  self.find = function(query, success, failure) { // query must be a valid hash with a_id &| u_id
    var search;
    if ('a_id' in query || 'u_id' in query) {
      search = query.a_id ? {resource: 'album', resource_id: query.a_id} : {resource: 'artist', resource_id: params.u_id};
    }
    if (!!search) {
      Tracks.find(search, function(tracks) {
        angular.forEach(tracks, function(track) {
          track.artist      = {id: track.artistId};
          track.album       = {id: track.albumId};
          track.releaseDate = new Date(track.releaseDate);
          if (!!track.coverArt &&
            (track.coverArt.search('track-coverart-placeholder') === -1)) {
            track.coverArt   = '../../' +
              track.coverArt.split('/').slice(1).join('/');
          }
          if (!!track.streamUrl) {
            track.streamUrl = '../../' +
              track.streamUrl.split('/').slice(1).join('/');
          }
        });
        success(tracks);
      }, function(err) {
        failure(err);
      });
    } else {
      failure('invalid find params');
    }
  };

  self.inflate = function(index, container, success, failure) {
    if (!index) {
      return $log.debug('there is no index sent to Tracks.inflate.')
    }
    self.get(index, function(track) {
      UsersSvc.get(track.artist.id, function(user) {
        track.artist.handle = user.handle;
      }, function(err) {
        $log.error('Error inflating track artist info: ' + err);
      });
      AlbumsSvc.get(track.album.id, function(album) {
        track.album.title  = album.title;
      }, function(err) {
        $log.error('Error inflating track album info: ' + err);
      });
      if (!!container) {
        container.push(track); 
      }
      success(track);
    }, function(err) {
      failure(err);
    });
  };

  self.downloadLink = function(track, success, failure) {
    var accessKeys  = store.getData('accessKeys');
    var accessToken = accessKeys ? accessKeys.access_token : null;
    var downloadUrl = '/zinfataclient/tracks/' + track._id + '/download';

    if (accessToken) {
      downloadUrl += '?token=' + accessToken;
      $window.open(downloadUrl);
    }
  };

  self.delete = function(track, success, failure) {
    Tracks.delete({id: track._id}, function(data) {
      data.artist      = {id: data.artistId};
      data.album       = {id: data.albumId};
      data.releaseDate = new Date(data.releaseDate); // AngularJs 1.3+ only accept valid Date format and not string equilavent
      delete data.artistId;
      delete data.albumId;
      success(data);
    }, function(err) {
      failure(err);
    });
  };
}]);
app.service('PlaylistsSvc', ['Playlists', '$log', function(Playlists, $log) {
  var self = this;

  self.create = function(playlist, success, failure) {
    var newPlaylist = new Playlists({
      title:        playlist.title,
      // coverArt:     playlist.coverArt,
      ownerId:      playlist.owner.id,
      Tracks:       playlist.tracks
    });

    newPlaylist.$save(function(savedPlaylist) {
      return success(savedPlaylist);
    }, function(err) {
      return failure(err);
    });
  };

  self.update = function(playlist, success, failure) {
    Playlists.get({id: playlist._id}, function(playlistToUpdate) {
      for (var key in playlistToUpdate) {
        if (!!playlist[key] && playlistToUpdate[key] !== playlist[key]) {
          playlistToUpdate[key] = playlist[key];
        }
      }
      /*
      if (!!playlist.coverArt) {
          playlistToUpdate.cover_art = playlist.coverArt;
          delete playlistToUpdate.imageUrl;
      }
      */
      playlistToUpdate.$update(function(updatedPlaylist) {
        return success(updatedPlaylist);
      }, function(err) {
        return failure(err);
      });
    });
  };

  self.get = function(playlistId, success, failure) {
    return Playlists.get({id: playlistId}, function(data) {
      data.owner = {id: data.ownerId};
      delete data.ownerId;
      /* 'Public' folder is outside the root path of the AngularJs app but inside ExpressJs static path
      if (!!data.coverArt)   data.coverArt   = '../../' + data.coverArt.split('/').slice(1).join('/');
      */
      success(data);
    }, function(err) {
      failure(err);
    });
  };

  self.all = Playlists.query(function(collection) {
    var ret = [];
    angular.forEach(collection, function(item) {
      item.owner = {id: item.ownerId};
      delete item.ownerId;
      this.push(item);
    }, ret);
    return ret;
  }, function(err) {
    $log.debug('Unable to get all the playlists!');
  });

  self.find = function(query, success, failure) { // params must be a valid hash with a_id &| u_id
    if ('u_id' in query) {
      query.resource    = 'owner';
      query.resource_id = query.u_id;

      delete query.u_id;

      Playlists.find(query, function(playlists) {
        angular.forEach(playlists, function(playlist) {
          playlist.owner = {id: playlist.ownerId};
          delete playlist.ownerId;
          /* 'Public' folder is outside the root path of the AngularJs app but inside ExpressJs static path
          ** if (!!playlist.coverArt)   playlist.coverArt   = '../../' + playlist.coverArt.split('/').slice(1).join('/');
          */
        });
        success(playlists);
      }, function(err) {
        failure(err);
      });
    }
  };

  self.delete = function(playlist, success, failure) {
    Playlists.delete({id: playlist._id}, function(data) {
      data.owner = {id: data.ownerId};
      delete data.ownerId;
      /* 'Public' folder is outside the root path of the AngularJs app but inside ExpressJs static path
      if (!!data.coverArt)   data.coverArt   = '../../' + data.coverArt.split('/').slice(1).join('/');
      */
      success(data);
    }, function(err) {
      failure(err);
    });
  };

  self.addTrack = function(playlist, track, success, failure) {
    Playlists.get({id: playlist._id}, function(playlistToUpdate) {
      playlistToUpdate.tracks.push(track._id);
      playlistToUpdate.$update(function(updatedPlaylist) {
        success(updatedPlaylist);
      }, function(err) {
        failure(false);
      });
    }, function(err) {
      failure(false);
    });
  };

  self.removeTrack = function(playlist, index, success, failure) {
    Playlists.get({id: playlist._id}, function(playlistToUpdate) {
      playlistToUpdate.tracks.splice(index, 1);
      playlistToUpdate.$update(function(updatedPlaylist) {
        success(updatedPlaylist);
      }, function(err) {
        failure(false);
      });
    }, function(err) {
      failure(false);
    });
  };
}]);

/*________________________________________________________

                    APP OTHER SERVICES
  ________________________________________________________*/

app.service('QueueSvc', ['localStore', '$rootScope', 'AUDIO', 'QUEUE', '$log',
'TracksSvc', 'SessionSvc', 'AUTH', function(queue, $rootScope, AUDIO, QUEUE,
$log, TracksSvc, Session, AUTH) {
  var self  = this;
  var owner = function() {
    return Session.getCurrentUser() && Session.getCurrentUser()._id;
  }

  self.playNext       = function() {
    var tracks      = self.getTracks();
    var nowPlaying  = self.getCurrentTrack();
    var queueLength = tracks.length;
    var index       = nowPlaying.index + 1;

    if (index >= queueLength) {
      index = 0;
    }

    self.getTrackAt(index, function(track) {
      self.play(track, index);
    });
  };

  self.playPrev       = function() {
    var tracks       = self.getTracks();
    var queueLength  = tracks.length;
    var currentIndex = self.getCurrentTrack().index;
    var index        = currentIndex - 1;
    if (index < 0) {
      index = queueLength - 1;
    }

    self.getTrackAt(index, function(track) {
      self.play(track, index);
    });
  };

  self.saveQueue       = function(tracks, nowPlaying) {
    if (tracks && Array.isArray(tracks)) {
      queue.setData(owner() + '.queue.tracks', tracks);
    }

    if (!!nowPlaying) {
      queue.setData(owner() + '.queue.nowPlaying', nowPlaying);
    }
  };

  self.clearQueue     = function() {
    self.saveQueue([]);
  };

  self.getCurrentTrack = function() {
    return queue.getData(owner() + '.queue.nowPlaying') || {};
  };

  self.addTrack        = function(track, playNext) {
    var tracks = self.getTracks();
    playNext ? tracks.unshift(track._id) : tracks.push(track._id);
    self.saveQueue(tracks);
  };

  self.getTracks       = function() {
    return queue.getData(owner() + '.queue.tracks') || [];
  };

  self.getTrackAt      = function(index, success, failure) {
    var tracks = self.getTracks();
    if (!!tracks.length) {
      TracksSvc.inflate(tracks[index], null, function(track) {
        success(track);
      }, function(err) {
        failure(err);
      });
    } else {
      failure('No tracks to fetch');
    }
  };

  self.removeTrackAt   = function(index, success, failure) {
    var tracks     = self.getTracks();
    var nowPlaying = self.getCurrentTrack();

    if (!!tracks.splice(index, 1).length) {
      if (nowPlaying.index > index) {
        nowPlaying.index--;
      } else if (nowPlaying.index === index) {
        if (index >= tracks.length) {
          index = 0;
        }
        self.getTrackAt(index, function(track) {
          self.play(track, index);
        }, function() {});
      }
      self.saveQueue(tracks, nowPlaying);
      success(index);
    } else {
      failure('Track removal from queue failed at index: ' + index);
    }
  };
  /* User clicks on a track's playNow button */
  self.playNow = function(track) {
    var newIndex   = 0;
    var queueCue   = 0;
    var nowPlaying = self.getCurrentTrack();
    var tracks     = self.getTracks();

    if (nowPlaying) {
      queueCue = nowPlaying.index;
    }

    /* If there is a queue, stick the track in after
       the current index position */
    if (!!tracks.length && !!Object.keys(nowPlaying).length) {
      tracks.splice(queueCue, 0, track._id);
      newIndex = queueCue++;
    } else if (!!tracks.length && !Object.keys(nowPlaying).length) { //there is no queue, add to end to create.
      self.addTrack(track, true);
    } else {
      self.addTrack(track);
    }
    self.play(track, newIndex);
  };

  self.play = function(track, index) {
    if (!('title' in track.album || 'handle' in track.artist)) {
      track = TracksSvc.inflate(track._id, null, function(inflatedTrack) {
        return inflatedTrack;
      }, function(err) {return;});
    }
    $log.debug(track.artist.handle + ' : ' + track.album.title);
    var nowPlaying = self.getCurrentTrack();
    nowPlaying.index = index;
    nowPlaying.track = track;
    self.saveQueue(null, nowPlaying);
    $rootScope.$broadcast(AUDIO.set, nowPlaying.track);
  };
}]);
app.service('MessageSvc', function() {
  this.message = null;

  this.getMsg   = function() {
    return this.message;
  };

  this.addMsg   = function(type, text) {
    this.message = {
      type: type,
      text: text
    };
  };

  this.clearQueue = function() {
    this.message = null;
  };
});
