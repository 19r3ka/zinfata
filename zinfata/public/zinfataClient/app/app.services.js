app.service('UsersSvc', ['Users', 'MessageSvc', '$log', '$location',
                         function(Users, MessageSvc, $log, $location) {
  this.currentUser = {};

  this.setCurrentUser = function(user) {
    this.currentUser = user;
  };
  this.getCurrentUser = function() {
    return this.currentUser;
  };

  this.create = function(user) {
    var new_user = new Users;
    for(var key in user) {
      new_user[key] = user[key];
    }
    new_user.$save(function(saved_user) {
      MessageSvc.addMsg('success', 'Welcome to Zinfata, ' + saved_user.firstName + '. Now log in to see your profile!');
      $location.path('login');
    }, function(error) {
      $log.error('Unable to save user: ' + error);
      MessageSvc.addMsg('danger', 'Oops, we were unable to register you!');
    });
  };

  this.delete = function(user, success, failure) {
    Users.delete({id: user._id}, function(data) {
      return success(data);
    }, function(error) {
      return failure(error)
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
   return Users.get({id: id}, function(user){
		if(!!user.avatarUrl)   user.avatarUrl  = '../../' + user.avatarUrl.split('/').slice(1).join('/');
		return success(user);
	}, function(err) {
		return failure(err);
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
      return success(saved_album);
    }, function(err) {
      return failure(err);
    });
  };

  this.update = function(album, success, failure) {
    Albums.get({id: album._id}, function(albumToUpdate) {
      for(var key in albumToUpdate) {
          if(!!album[key] && albumToUpdate[key] !== album[key]) albumToUpdate[key] = album[key];
      }
      if(!!album.coverArt) {
          albumToUpdate.cover_art = album.coverArt;
          delete albumToUpdate.imageUrl;
      }
      albumToUpdate.$update(function(updatedAlbum) {
          return success(updatedAlbum);
      }, function(err) {
          return failure(err);
      });
    });
  };

  this.get = function(albumId, success, failure) {
    return Albums.get({ id: albumId }, function(data) {
    	data.releaseDate = new Date(data.releaseDate); 									   							 // AngularJs 1.3+ only accept valid Date format and not string equilavent
    	if(!!data.imageUrl)   data.imageUrl  = '../../' + data.imageUrl.split('/').slice(1).join('/');         // 'Public' folder is outside the root path of the AngularJs app but inside ExpressJs static path
      return success(data);
    }, function(err) {
    	return failure(err);
    });
  };

  this.getByUser = function(user, success, failure) {
  	return Albums.getByUser({user_id: user._id}, function(data) {
  		data.releaseDate = new Date(data.releaseDate);
  		if(!!data.imageUrl)	data.imageUrl  = '../../' + data.imageUrl.split('/').slice(1).join('/');
  		return success(data);
  	}, function(err) {
  		return failure(err);
  	});
  };

  this.delete = function(album, success, failure) {
    return Albums.delete({id: album._id}, function(data) {
      return success(data);
    }, function(err) {
      return failure(err);
    });
  };
}]);
app.service('Session', function() {
  this.userId = '';
  this.userRole = '';
  this.create = function(userId, userRole) {
    this.userId = userId;
    this.userRole = userRole;
  };

  this.destroy = function() {
    this.userId = '';
    this.userRole = '';
  };
});
app.service('MessageSvc', function() {
  this.messages = [];
  this.addMsg   = function(type, text) {
    var message = {
      type: type,
      text: text
    };

    this.messages.push(message);
  };
  this.clearQueue = function() {
    this.messages.length = 0;
  };
});
app.service('TracksSvc', ['Tracks', '$log', function(Tracks, $log) {
  this.create = function(track, success, failure) {
    var new_track = new Tracks({
      title:        track.title,
      artistId:     track.artist.id,
      albumId:      track.album.id,
      feat:         track.feat,
      streamUrl:    track.streamUrl,
      coverArt:     track.coverArt,
      imageFile:    track.imageFile,
      audioFile:    track.audioFile,
      releaseDate:  track.releaseDate
    });

    new_track.$save(function(saved_track) {
      return success(saved_track);
    }, function(err) {
      return failure(err);
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
      $log.debug(trackToUpdate);
      trackToUpdate.$update(function(updatedTrack) {
          return success(updatedTrack);
      }, function(err) {
          return failure(err);
      });
    });
  };

  this.get = function(trackId, success, failure) {
    return Tracks.get({ id: trackId }, function(data) {
      data.artist    = { id: data.artistId };
      data.album     = { id: data.albumId };
      data.releaseDate  = new Date(data.releaseDate); // AngularJs 1.3+ only accept valid Date format and not string equilavent
      delete data.artistId;
      delete data.albumId;                                  
      if(!!data.coverArt)   data.coverArt   = '../../' + data.coverArt.split('/').slice(1).join('/');         // 'Public' folder is outside the root path of the AngularJs app but inside ExpressJs static path
      if(!!data.streamUrl)  data.streamUrl  = '../../' + data.streamUrl.split('/').slice(1).join('/');
      return success(data);
    }, function(err) {
      return failure(err);
    });
  };

  this.find = function(params, success, failure) { // params must be a valid hash with a_id &| u_id
    return Tracks.get(params, function(data) {
      data.artist    = { id: data.artistId };
      data.album     = { id: data.albumId };
      data.releaseDate  = new Date(data.releaseDate);
      if(!!data.coverArt)   data.coverArt  = '../../' + data.coverArt.split('/').slice(1).join('/');
      if(!!data.streamUrl)  data.streamUrl = '../../' + data.streamUrl.split('/').slice(1).join('/');
      return success(data);
    }, function(err) {
      return failure(err);
    });
  };

  this.delete = function(track, success, failure) {
    return Tracks.delete({id: track._id}, function(data) {
      data.artist       = { id: data.artistId };
      data.album        = { id: data.albumId };
      data.releaseDate  = new Date(data.releaseDate); // AngularJs 1.3+ only accept valid Date format and not string equilavent
      delete data.artistId;
      delete data.albumId;
      return success(data);
    }, function(err) {
      return failure(err);
    });
  };
}]);app.service('PlaylistsSvc', ['Playlists', '$log', function(Playlists, $log) {
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
      $log.debug(playlistToUpdate);
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
      return success(data);
    }, function(err) {
      return failure(err);
    });
  };

  this.find = function(params, success, failure) { // params must be a valid hash with a_id &| u_id
    return Playlists.find(params, function(data) {
      data.owner     = { id: data.ownerId };
      delete data.ownerId;
      /* 'Public' folder is outside the root path of the AngularJs app but inside ExpressJs static path
      if(!!data.coverArt)   data.coverArt   = '../../' + data.coverArt.split('/').slice(1).join('/');
      */
      return success(data);
    }, function(err) {
      return failure(err);
    });
  };

  this.delete = function(playlist, success, failure) {
    return Playlists.delete({id: playlist._id}, function(data) {
      data.owner     = { id: data.ownerId };
      delete data.ownerId;
      /* 'Public' folder is outside the root path of the AngularJs app but inside ExpressJs static path
      if(!!data.coverArt)   data.coverArt   = '../../' + data.coverArt.split('/').slice(1).join('/');
      */
      return success(data);
    }, function(err) {
      return failure(err);
    });
  };

  this.addTrack = function(playlist, track, success, failure) {
    Playlists.get({ id: playlist._id }, function(playlistToUpdate) {
      playlistToUpdate.tracks.push(track._id);
      
      playlistToUpdate.$update(function(updatedPlaylist) {
          return true;
      }, function(err) {
          return false;
      });
    }, function(err) {
      return false;
    })
  };

  this.removeTrack = function(playlist, index, success, failure) {
    Playlists.get({ id: playlist._id }, function(playlistToUpdate) {
      playlistToUpdate.splice(index, 1);
      playlistToUpdate.$update(function(updatedPlaylist) {
          return true;
      }, function(err) {
          return false;
      });
    }, function(err) {
      return false;
    });
  };
}]);