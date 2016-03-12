/*__________________________________________
          AUTHENTICATION SERVICES
  __________________________________________*/

app.service('SessionSvc', ['$rootScope', 'AUTH', 'UsersSvc', 'sessionStore',
                          function($rootScope, AUTH, UsersSvc, store) {
  var self        = this,
      currentUser = null;

  $rootScope.$on(AUTH.loginSuccess, function(events, user){
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
app.service('AuthenticationSvc', ['$rootScope', 'AUTH', 'ROUTES', 'SessionSvc', 'sessionStore', 'AccessToken', '$log',
                                function($rootScope, AUTH, ROUTES, Session, store, AccessToken, $log) {
  var self  = this;

  self.login = function(credentials, success, failure) {
    /*First authenticate the user against server database.*/
    AccessToken.getFor({username: credentials.handle, password: credentials.password}, function(tokens) {
      $rootScope.$broadcast(AUTH.authenticated);
      /*Second, get the metadata of the user who was granted access to API.*/
      AccessToken.getUser({token: tokens.access_token}, function(user) {
        if(!!user.activated) {
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
    var accessKeys    = store.getData('accessKeys'),
        refreshToken  = accessKeys ? accessKeys.refresh_token : null;

    AccessToken.revoke({ token_type_hint: 'refresh_token', token: refreshToken }, function() {
      Session.destroy();
      callback(true);
    }, function(err) {
      if(err.error_description === 'invalid token') {
        Session.destroy();
        callback(true);
      }
    });

    callback(false);
  };

  self.isAuthenticated = function() {
    if(Session.getCurrentUser() && Session.getCurrentUser()._id) {
      $rootScope.$broadcast(AUTH.authenticated);
      return true;
    }
    $rootScope.$broadcast(AUTH.notAuthenticated);
    return false;
  };

  self.authorize = function(loginRequired) {
    var result = AUTH.authorized,
        logged = self.isAuthenticated();

    if(!!loginRequired && !!!logged){
      result = AUTH.mustLogIn;
    }
    return result;
  };
}]);

/*________________________________________________________
                    APP CORE SERVICES
  ________________________________________________________*/

app.service('UsersSvc', ['Users', 'MessageSvc', '$log', '$location', '$rootScope',
                         function(Users, MessageSvc, $log, $location, $rootScope) {

  this.create = function(user, success, failure) {
    var new_user = new Users();
    for(var key in user) {
      new_user[key] = user[key];
    }
    new_user.$save(function(saved_user) {
      success(saved_user);
    }, function(err) {
      failure(err);
    });
  };

  this.delete = function(user, success, failure) {
    Users.delete({id: user._id}, function(data) {
      return success(data);
    }, function(error) {
      return failure(error);
    });
  };

  this.update = function(user, success, failure) {
    Users.get({id: user._id}, function(userToUpdate) {
      for(var key in userToUpdate) {
        if(!!user[key] && userToUpdate[key] !== user[key]) userToUpdate[key] = user[key];
      }
      if(!!user.avatar) {
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

  this.get = function(id, success, failure) {
    Users.get({id: id}, function(user) {
		  if(!!user.avatarUrl && (user.avatarUrl.search('user-avatar-placeholder') === -1)) user.avatarUrl = '../../' + user.avatarUrl.split('/').slice(1).join('/');
		  success(user);
	  }, function(err) {
		  failure(err);
	  });
  };

  this.findByHandle = function(handle, success, failure) {
    return Users.find({handle: handle}, function(user) {
      success(user);
    }, function(err) {
      failure(err);
    });
  };
}]);
app.service('AlbumsSvc', ['Albums', '$log', function(Albums, $log) {
  this.create = function(data, success, failure) {
    var new_album = new Albums(
      {
        title:         data.title,
        coverArt:      data.coverArt,
        artistId:      data.artistId,
        releaseDate:   data.releaseDate
      }
    );
    new_album.$save(function(saved_album) {
      success(saved_album);
    }, function(err) {
      failure(err);
    });
  };

  this.update = function(album, success, failure) {
    Albums.get({id: album._id}, function(albumToUpdate) {
      for(var key in albumToUpdate) {
          if(!!album[key] && albumToUpdate[key] !== album[key]) albumToUpdate[key] = album[key];
      }
      if(!!album.coverArt) {
          albumToUpdate.cover_art = album.coverArt;
          // albumToUpdate.imageUrl;
      }
      albumToUpdate.$update(function(updatedAlbum) {
          success(updatedAlbum);
      }, function(err) {
          failure(err);
      });
    });
  };

  this.get = function(albumId, success, failure) {
    Albums.get({ id: albumId }, function(data) {
    	data.releaseDate = new Date(data.releaseDate); 	// AngularJs 1.3+ only accept valid Date format and not string equilavent
    	if(!!data.imageUrl && (data.imageUrl.search('album-coverart-placeholder') === -1)) data.imageUrl = '../../' + data.imageUrl.split('/').slice(1).join('/');  // 'Public' folder is outside the root path of the AngularJs app but inside ExpressJs static path
      success(data);
    }, function(err) {
    	failure(err);
    });
  };

  this.getByUser = function(user, success, failure) {
  	Albums.getByUser({user_id: user._id}, function(albums) {
      angular.forEach(albums, function(data) {
  		  data.releaseDate = new Date(data.releaseDate);
        if(!!data.imageUrl && (data.imageUrl.search('album-coverart-placeholder') === -1)) data.imageUrl = '../../' + data.imageUrl.split('/').slice(1).join('/');  // 'Public' folder is outside the root path of the AngularJs app but inside ExpressJs static path
      });
  	  success(albums);
  	}, function(err) {
  		failure(err);
  	});
  };

  this.delete = function(album, success, failure) {
    Albums.delete({id: album._id}, function(data) {
      success(data);
    }, function(err) {
      failure(err);
    });
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
app.service('TracksSvc', ['Tracks', '$log', 'UsersSvc', 'AlbumsSvc', '$window', 'sessionStore',
                          function(Tracks, $log, UsersSvc, AlbumsSvc, $window, store) {
  this.create = function(track, success, failure) {
    var new_track = new Tracks({
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

    new_track.$save(function(saved_track) {
      success(saved_track);
    }, function(err) {
      failure(err);
    });
  };

  this.update = function(track, success, failure) {
    Tracks.get({ id: track._id }, function(trackToUpdate) {
      for(var key in trackToUpdate) {
          if(!!track[key] && trackToUpdate[key] !== track[key]) trackToUpdate[key] = track[key];
      }
      trackToUpdate.albumId = track.album.id;
      if(!!track.coverArt) {
          trackToUpdate.cover_art = track.coverArt;
          delete trackToUpdate.imageUrl;
      }
      trackToUpdate.$update(function(updatedTrack) {
          success(updatedTrack);
      }, function(err) {
          failure(err);
      });
    });
  };

  this.get = function(trackId, success, failure) {
    Tracks.get({ id: trackId }, function(data) {
      data.artist      = { id: data.artistId };
      data.album       = { id: data.albumId };
      data.releaseDate = new Date(data.releaseDate); // AngularJs 1.3+ only accept valid Date format and not string equilavent
      delete data.artistId;
      delete data.albumId;                                  
      if(!!data.coverArt) data.coverArt   = '../../' + data.coverArt.split('/').slice(1).join('/');  // 'Public' folder is outside the root path of the AngularJs app but inside ExpressJs static path
      if(!!data.streamUrl) data.streamUrl = '../../' + data.streamUrl.split('/').slice(1).join('/');
      success(data);
    }, function(err) {
      failure(err);
    });
  };

  this.find = function(query, success, failure) { // query must be a valid hash with a_id &| u_id
    var search;
    if('a_id' in query || 'u_id' in query) {
      search = query.a_id ? { resource: 'album', resource_id: query.a_id } : { resource: 'artist', resource_id: params.u_id };
    }
    if(!!search) {
      Tracks.find(search, function(tracks) {
        angular.forEach(tracks, function(track) {
          track.artist      = { id: track.artistId };
          track.album       = { id: track.albumId };
          track.releaseDate = new Date(track.releaseDate);
          if(!!track.coverArt && (track.coverArt.search('track-coverart-placeholder') === -1)) track.coverArt   = '../../' + track.coverArt.split('/').slice(1).join('/');
          if(!!track.streamUrl) track.streamUrl = '../../' + track.streamUrl.split('/').slice(1).join('/');
        });
        success(tracks);
      }, function(err) {
        failure(err);
      });
    } else {
      failure('invalid find params');
    }
  };

  this.inflate = function(index, container, success, failure) {
    if(!index) return $log.debug('there is no index sent to Tracks.inflate.')
      this.get(index, function(track) {
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
        if(!!container) container.push(track); 
        success(track);
      }, function(err) {
        failure(err);
      });
  };

  this.downloadLink = function(track, success, failure) {
    var accessKeys  = store.getData('accessKeys'),
        accessToken = accessKeys ? accessKeys.access_token : null,
        downloadUrl = '/zinfataclient/tracks/' + track._id + '/download';

    if(accessToken) { 
      downloadUrl += '?token=' + accessToken;
      $window.open(downloadUrl);
    }
  };

  this.delete = function(track, success, failure) {
    Tracks.delete({id: track._id}, function(data) {
      data.artist      = { id: data.artistId };
      data.album       = { id: data.albumId };
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
  this.create = function(playlist, success, failure) {
    var new_playlist = new Playlists({
      title:        playlist.title,
      // coverArt:     playlist.coverArt,
      ownerId:      playlist.owner.id,
      Tracks:       playlist.tracks
    });

    new_playlist.$save(function(saved_playlist) {
      return success(saved_playlist);
    }, function(err) {
      return failure(err);
    });
  };

  this.update = function(playlist, success, failure) {
    Playlists.get({ id: playlist._id }, function(playlistToUpdate) {
      for(var key in playlistToUpdate) {
          if(!!playlist[key] && playlistToUpdate[key] !== playlist[key]) playlistToUpdate[key] = playlist[key];
      }
      /*
      if(!!playlist.coverArt) {
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

  this.get = function(playlistId, success, failure) {
    return Playlists.get({ id: playlistId }, function(data) {
      data.owner    = { id: data.ownerId };
      delete data.ownerId;
      /* 'Public' folder is outside the root path of the AngularJs app but inside ExpressJs static path
      if(!!data.coverArt)   data.coverArt   = '../../' + data.coverArt.split('/').slice(1).join('/');
      */
      success(data);
    }, function(err) {
      failure(err);
    });
  };

  this.find = function(query, success, failure) { // params must be a valid hash with a_id &| u_id
    if('u_id' in query) {
      query.resource    = 'owner';
      query.resource_id = query.u_id;

      delete query.u_id;

      Playlists.find(query, function(playlists) {
        angular.forEach(playlists, function(playlist) {
          playlist.owner = { id: playlist.ownerId };
          delete playlist.ownerId;
          /* 'Public' folder is outside the root path of the AngularJs app but inside ExpressJs static path
          ** if(!!playlist.coverArt)   playlist.coverArt   = '../../' + playlist.coverArt.split('/').slice(1).join('/');
          */
        })
        success(playlists);
      }, function(err) {
        failure(err);
      });   
    }
    
  };

  this.delete = function(playlist, success, failure) {
    Playlists.delete({id: playlist._id}, function(data) {
      data.owner     = { id: data.ownerId };
      delete data.ownerId;
      /* 'Public' folder is outside the root path of the AngularJs app but inside ExpressJs static path
      if(!!data.coverArt)   data.coverArt   = '../../' + data.coverArt.split('/').slice(1).join('/');
      */
      success(data);
    }, function(err) {
      failure(err);
    });
  };

  this.addTrack = function(playlist, track, success, failure) {
    Playlists.get({ id: playlist._id }, function(playlistToUpdate) {
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

  this.removeTrack = function(playlist, index, success, failure) {
    Playlists.get({ id: playlist._id }, function(playlistToUpdate) {
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
app.service('QueueSvc', ['localStore', '$rootScope', 'AUDIO', 'QUEUE', '$log', 'TracksSvc', 'SessionSvc',
                        function(queue, $rootScope, AUDIO, QUEUE, $log, TracksSvc, Session) {
  var self  = this,
      owner = Session.getCurrentUser() && Session.getCurrentUser()._id;

  self.data = {
    currentlyPlaying: {
      index: null,
      track: null
    },
    tracks: [] //index of tracks in queue
  };

  self.playNext       = function() {
    self.getTracks();
    var queueLength  = self.data.tracks.length,
        index        = self.data.currentlyPlaying.index + 1;
    
    if(index >= queueLength) index = 0;
    
    self.getTrackAt(index, function(track) {
      self.play(track, index);
    });
  };

  self.playPrev       = function() {
    self.getTracks();
    var queueLength  = self.data.tracks.length,
        currentIndex = self.data.currentlyPlaying.index,
        index        = currentIndex - 1;
    if(index < 0) index = queueLength - 1;

    self.getTrackAt(index, function(track) {
      self.play(track, index);
    });
  };

  self.saveQueue       = function() {
    queue.setData(owner + '.queue.tracks', self.data.tracks);
    queue.setData(owner + '.queue.nowPlaying', self.data.currentlyPlaying);
  };

  self.clearQueue     = function() {
    self.data.tracks = [];
    self.saveQueue();
  }; 

  self.getCurrentTrack = function() {
    return queue.getData(owner + '.queue.nowPlaying');
  };

  self.addTrack        = function(track, playNext) {
    self.getTracks();
    playNext ? self.data.tracks.unshift : self.data.tracks.push(track._id);
    self.saveQueue();
  };

  self.getTracks       = function() {
    if(!!!self.data.tracks.length) self.data.tracks = queue.getData(owner + '.queue.tracks') || [];
    return self.data.tracks;
  };

  self.getTrackAt      = function(index, success, failure) {
    self.getTracks();
    if(!!self.data.tracks.length) {
      TracksSvc.inflate(self.data.tracks[index], null, function(track) {
        success(track);
      }, function(err) { failure(err);} );
    } else {
      failure('No tracks to fetch');
    }
  }; 

  self.removeTrackAt   = function(index, success, failure) {
    self.getTracks();
    if(!!self.data.tracks.splice(index, 1).length) {
      if(self.data.currentlyPlaying.index > index) {
        self.data.currentlyPlaying.index--;
      } else if(self.data.currentlyPlaying.index === index) {
        if(index >= self.data.tracks.length) index = 0;
        self.getTrackAt(index, function(track) {
          self.play(track, index);
        }, function(){})
      }
      self.saveQueue();
      success(index);
    } else {
      failure('Track removal from queue failed at index: ' + index);
    }
  };
  /* User clicks on a track's playNow button */
  self.playNow         = function(track) {
    var newIndex = 0,
        queueCue = self.data.currentlyPlaying.index;
    
    self.getTracks();
    /* If there is a queue, stick the track in after
       the current index position */
    if(!!self.data.tracks.length) { 
        self.data.tracks.splice(queueCue, 0, track._id);
        newIndex = self.data.currentlyPlaying.index++;
    } else { //there is no queue, add to end to create. 
      self.addTrack(track);
    }
    self.play(track, newIndex);
  };

  self.play           = function(track, index) {
    if(!('album' in track && track.album.title) || ('artist' in track && track.artist.handle)) {
      TracksSvc.inflate(track._id, null, function(inflated_track) {
        track = inflated_track;
      }, function(err) {return;});
    }
    self.data.currentlyPlaying.index = index;
    self.data.currentlyPlaying.track = track;
    self.saveQueue();
    $rootScope.$broadcast(AUDIO.set, self.data.currentlyPlaying.track);
  };
}]);
