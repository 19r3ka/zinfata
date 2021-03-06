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

  self.authorize = function(routeAccess) {
    var result = AUTH.authorized;
    var logged = self.isAuthenticated();

    if (('loginRequired' in routeAccess) && !!!logged) {
      result = AUTH.mustLogIn;
    }

    if ('mustBeRoot' in routeAccess) {
      if (Session.getCurrentUser() && (Session.getCurrentUser().role !== 'root')) {
        result = AUTH.notAuthorized;
      }
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
        if (!!user[key] && (userToUpdate[key] !== user[key])) {
          userToUpdate[key] = user[key];
        }
      }
      if (!!user.avatar) {
        userToUpdate.avatar = user.avatar;
      }
      /* Eventually delete all these 4 following ifs.
         They are probably not necessary. */
      if (user.facebook) {
        userToUpdate.facebook = user.facebook;
      }

      if (user.bio) {
        userToUpdate.bio = user.bio;
      }

      if (user.twitter) {
        userToUpdate.twitter = user.twitter;
      }

      if (user.website) {
        userToUpdate.website = user.website;
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
      user.img = '/assets/users/' + user._id + '/tof';
      success(user);
    }, function(err) {
      failure(err);
    });
  };

  self.all = Users.query(function(collection) {
    return collection;
  }, function(err) {
    $log.debug('Unable to get all the users!');
  });

  self.findByHandle = function(handle, success, failure) {
    return Users.find({handle: handle}, function(user) {
      user.img = '/assets/users/' + user._id + '/tof';
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
        about:         data.about,
        artistId:      data.artist.id,
        coverArt:      data.coverArt,
        releaseDate:   data.releaseDate,
        title:         data.title
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
        if (!!album[key] && (albumToUpdate[key] !== album[key])) {
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
      data.img = '/assets/albums/' + data._id + '/tof';
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
      item.img = '/assets/albums/' + item._id + '/tof';
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
        data.img = '/assets/albums/' + data._id + '/tof';
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
      about:        track.about,
      albumId:      track.album._id,
      artistId:     track.artist._id,
      audioFile:    track.audioFile,
      coverArt:     track.coverArt,
      downloadable: track.downloadable,
      duration:     track.duration,
      feat:         track.feat,
      genre:        track.genre,
      imageFile:    track.imageFile,
      lyrics:       track.lyrics,
      releaseDate:  track.releaseDate,
      streamUrl:    track.streamUrl,
      title:        track.title
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

      // manually fill albumId and artistId which are not in the trackModel... yet
      // TODO: modify track service and route to assign 'album' and 'assign' field directly
      trackToUpdate.albumId  = track.album._id;
      trackToUpdate.artistId = track.artist._id;

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
      data.releaseDate = new Date(data.releaseDate); // AngularJs 1.3+ only accept valid Date format and not string equilavent
      data.img = '/assets/tracks/' + data._id + '/tof';
      data.url = '/assets/tracks/' + data._id + '/zik';
      success(data);
    }, function(err) {
      failure(err);
    });
  };

  self.latest = function(success, failure) {
    Tracks.query(function(collection) {
      var ret = [];
      angular.forEach(collection, function(item) {
        item.releaseDate = new Date(item.releaseDate); // AngularJs 1.3+ only accept valid Date format and not string equilavent
        item.img = '/assets/tracks/' + item._id + '/tof';
        item.url = '/assets/tracks/' + item._id + '/zik';
        this.push(item);
      }, ret);
      success(ret);
    }, function(err) {
      failure('Could query all the tracks!');
    });
  };

  self.find = function(query, success, failure) { // query must be a valid hash with a_id &| u_id
    var search;
    if ('a_id' in query || 'u_id' in query) {
      search = query.a_id ? {resource: 'album', resource_id: query.a_id} : {resource: 'artist', resource_id: params.u_id};
    }
    if (!!search) {
      Tracks.find(search, function(tracks) {
        angular.forEach(tracks, function(track) {
          track.releaseDate = new Date(track.releaseDate);
          track.img = '/assets/tracks/' + track._id + '/tof';
          track.url = '/assets/tracks/' + track._id + '/zik';
        });
        success(tracks);
      }, function(err) {
        failure(err);
      });
    } else {
      failure('invalid find params');
    }
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
      data.releaseDate = new Date(data.releaseDate); // AngularJs 1.3+ only accept valid Date format and not string equilavent
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
      // coverArt:     playlist.coverArt,
      ownerId:      playlist.owner.id,
      title:        playlist.title,
      tracks:       playlist.tracks
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

  /* Appends a track to queue */
  function addTrack(track, playNext) {
    var tracks = getTracks();
    tracks.push(track._id);
    saveQueue(tracks);
  }

  /* Resets the queue list */
  function clearQueue() {
    saveQueue([]);
  }

  /* Gets the current playing track */
  function getCurrentTrack() {
    return queue.getData(owner() + '.queue.nowPlaying') || {};
  }

  /* Gets the track at a specific position */
  function getTrackAt(index, cb) {
    var tracks = getTracks();
    if (!!tracks.length) {
      TracksSvc.get(tracks[index], cb);
    } else {
      cb('No tracks to fetch');
    }
  }

  /* Gets all tracks in queue */
  function getTracks() {
    return queue.getData(owner() + '.queue.tracks') || [];
  }

  /* Gets and loads the next track in queue */
  function load(index) {
    if (getTracks().length <= 1) {
      $log.error('There isn\'t any next track to load!');
      return;
    }
    getTrackAt(index, function(track) {
      saveQueue(null, track);
      $rootScope.$broadcast(AUDIO.load, track);
    });
  }

  /* Gets and plays the next track in queue */
  function next() {
    if (getTracks().length <= 1) {
      $log.error('There isn\'t any next track to play!');
      return;
    }
    getTrackAt(1, function(track) {
      playNow(track, 1);
    });
  }

  /* Returns currently logged user */
  function owner() {
    return Session.getCurrentUser() && Session.getCurrentUser()._id;
  }

  /* Broadcasts the track to be played */
  function play(track) {
    saveQueue(null, track);
    $rootScope.$broadcast(AUDIO.playNow, track);
  }

  /* Takes a track in queue and sets it as nowPlaying */
  function playNow(track, oldIndex) {
    var tracks;
    // if there is an index, remove track from the queue...
    if (oldIndex) {
      removeTrackAt(oldIndex, function(success) {
        if (!success) {
          $log.error('Failed to remove track at %s', oldIndex);
          return false;
        }
      });
    }
    // ... before adding it to the top.
    tracks = getTracks();
    tracks.unshift(track._id);
    saveQueue(tracks);
    // remove the old nowPlaying track
    removeTrackAt(1, function(success) {
      if (!success) {
        $log.error('Failed to remove next track inline');
        return false;
      }
      play(track);
    });
  }

  /* Get and plays the last track in queue */
  function prev() {
    if (getTracks().length <= 1) {
      $log.error('There isn\'t any previous track to play!');
      return;
    }
    var index = getTracks().length - 1;
    getTrackAt(index, function(track) {
      playNow(track, index);
    });
  }

  /* Removes the track at a specific position */
  function removeTrackAt(index, cb) {
    var removed;
    var tracks = getTracks();

    removed = tracks.splice(index, 1);
    if (!removed.length) {
      cb(false);
    }
    saveQueue(tracks);
    cb(removed[0]);
  }

  /* Saves the queue and the nowPlaying track */
  function saveQueue(trackList, nowPlaying) {
    if (trackList && Array.isArray(trackList)) {
      queue.setData(owner() + '.queue.tracks', trackList);
    }

    if (!!nowPlaying) {
      queue.setData(owner() + '.queue.nowPlaying', nowPlaying);
    }
  }

  self.addTrack        = addTrack;
  self.getCurrentTrack = getCurrentTrack;
  self.getTrackAt      = getTrackAt;
  self.getTracks       = getTracks;
  self.load            = load;
  self.playNext        = next;
  self.playNow         = playNow;
  self.playPrev        = prev;
  self.removeTrackAt   = removeTrackAt;
}]);
app.service('MessageSvc', function() {
  this.message = null;

  this.getMsg = function() {
    return this.message;
  };

  this.addMsg = function(type, text) {
    this.message = {
      type: type,
      text: text
    };
  };

  this.clear = function() {
    this.message = null;
  };
});
app.service('InvitationsSvc', ['Invitations', '$log', '$cookies',
function(Invitations, $log, Cookies) {
  var self = this;

  function create(invitation, success, failure) {
    var newInvite = new Invitations({
      contact:  invitation.contact,
      medium:   invitation.medium
    });

    return newInvite.$save(function(savedInvite) {
      success(savedInvite)
    }, function(err) {
      failure(err)
    });
  }

  function iDelete(invite, success, failure) { //prefixed with i to avoid conflict with JS delete()
    Invitations.delete({id: invite._id}, function successCb(deletedInvite) {
      return success(deletedInvite);
    }, function failureCb (err) {
      return failure(err);
    });
  }

  function get(inviteId, success, failure) {
    Invitations.get({id: inviteId}, function successCb(invitation) {
      return success(invitation);
    }, function failureCb(err) {
      return failure(err);
    });
  }

  function getAll(success, failure) {
    Invitations.query(function successCb(invitations) {
      return success(invitations);
    }, function failureCb(err) {
      return failure(err);
    });
  }


  function send(invitation, success, failure) {
    Invitations.send({id: invitation._id}, function(sentInvite) {
      return success(sentInvite);
    }, function(err) {
      return failure(err);
    });
  }

  /* Sets a validation cookie to verify before displaying the registration page */
  function setCookie(cookie) {
    /* Set expiration date to a year from now */
    var expirationDate = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000));

    Cookies.put('vc', cookie /*, { expires: expirationDate }*/);
  }

  /* Unsets the validation cookie */
  function unsetCookie(cookie) {
    Cookies.remove('vc');
  }

  function update(invite, success, failure) {
    Invitations.get({id: invite._id}, function(inviteToUpdate) {
      for (var key in inviteToUpdate) {
        if (!!invite[key] && inviteToUpdate[key] !== invite[key]) {
          inviteToUpdate[key] = invite[key];
        }
      }

      inviteToUpdate.$update(function(updatedInvite) {
        return success(updatedInvite);
      }, function(err) {
        failure(err)
      });
    });
  }

  /* PRIVATE: Validate invitation code or verification cookie */
  function validate(query, success, failure) {
    Invitations.validate(query, function(validatedInvite) {
      return success(validatedInvite);
    }, function(err) {
      return failure(err);
    });
  }

  /* Validates invitation code */
  function validateCode(code, success, failure) {
    var query = {
      ic: code
    };

    validate(query, function(invitation) {
      return success(invitation);
    }, function(err) {
      return failure(err);
    });
  }

  /* Verify cookie to see if code has been exist and has been validated */
  function verifyCookie(success, failure) {
    var cookie = Cookies.get('vc');

    if (!cookie) {
      return failure({
        status:   401,
        message:  'There is no cookie.'
      });
    }

    var query = {
      vc: cookie
    };

    validate(query, function(invitation) {
      return success(invitation);
    }, function(err) {
      return failure(err);
    });
  }

  function verifyEmail(email, success, failure) {
    var query = {
      ec: email
    };

    validate(query, function(invitation) {
      return success(invitation);
    }, function(err) {
      return failure(err);
    });
  }

  self.create =       create;
  self.delete =       iDelete;
  self.get =          get;
  self.getAll =       getAll;
  self.send =         send;
  self.setCookie =    setCookie;
  self.update =       update;
  self.validate =     validateCode;
  self.verifyCookie = verifyCookie;
  self.verifyEmail =  verifyEmail;
}]);
