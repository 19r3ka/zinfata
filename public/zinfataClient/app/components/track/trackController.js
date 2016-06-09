app.controller('trackCtrl', ['$scope', '$sce', '$rootScope', '$location',
  '$routeParams', '$log', 'UsersSvc', 'SessionSvc', 'TracksSvc',
  'PlaylistsSvc', 'TRACK_EVENTS', 'AlbumsSvc', 'ALBUM_EVENTS', 'MessageSvc',
  'QueueSvc', function($scope, $sce, $rootScope, $location, $routeParams, $log,
  UsersSvc, Session, TracksSvc, PlaylistsSvc, TRACK_EVENTS, AlbumsSvc, ALBUM,
  MessageSvc, QueueSvc) {
  var userAddedFile  = 'images/track-coverart-placeholder.png'; // default image
  var coverArts      = {};
  var releaseDates   = {};
  var getUserAlbums  = function(id) {
    AlbumsSvc.getByUser({_id: id}, function(data) {
      if (!data.length) {return;}

      /* When creating a new track. Default assign to first album */
      if (!$scope.track.album.id) {
        $scope.track.album.title       = data[0].title;
        $scope.track.album.releaseDate = data[0].releaseDate;
        $scope.track.album.id          = data[0]._id;
      }

      angular.forEach(data, function(album) {
        // coverArts[album._id]      = album.imageUrl;
        releaseDates[album._id]   = album.releaseDate;
        if (album._id === $scope.track.album.id) {
          $scope.track.album.title       = album.title;
          $scope.track.album.releaseDate = album.releaseDate;
          // $scope.track.album.coverArt    = album.imageUrl;
          // if ($scope.track.coverArt !== album.imageUrl) {
          //   $scope.cover.unique = true;
          //    Save the original unique cover art in case we need to revert back to it
          //      when the user unchecks 'cover.unique' without uploading new cover afterwards
          //   userAddedFile       = $scope.track.coverArt;
          // }
        }
      });
      $scope.albums = data;
    }, function(err) {
      $log.error('Error fetching albums for artist: ' +
        $scope.track.artist.id);
    });
  };

  $scope.musicGenres = [
    'alternative', 'blues', 'danse', 'hip hop', 'rap','r&b', 'soul', 'jazz',
    'gospel', 'reggae', 'rock', 'dubstep', 'trap', 'instrumental', 'salsa',
    'flamenco', 'reggaeton', 'meditation', 'funk', 'dancehall', 'a cappella',
    'afro-beat', 'calypso', 'coupe-decale', 'worldbeat'
  ];

  $scope.track = {
    title:       '',
    about:       '',
    lyrics:      '',
    album:  {
      id:      null,
      title:   '',
      coverArt: ''
    },
    artist: {
      id:      null,
      handle:  ''
    },
    streamUrl:   '',
    coverArt:    'images/track-coverart-placeholder.png',
    duration:    '',
    releaseDate: '',
    genre:       '',
    downloadable: false
  };

  $scope.cover = {
    useAlbum: false
  };

  $scope.albums = [];
  $scope.creating = $scope.editing = false;
  $scope.pageTitle = 'Add New Track';
  $scope.pageDescription = 'Upload a new song for the world to enjoy.';

  $scope.track.img = $scope.track.coverArt;

  if ($location.path() === '/track/new') {
    $scope.creating = true;
  }

  if ($routeParams.trackId) {
    TracksSvc.get($routeParams.trackId, function(data) {
      $scope.track            = data;
      $scope.track.img        = '/assets/tracks/' + $scope.track._id + '/tof';
      $scope.track.album.img  = '/assets/albums/' + $scope.track.album.id +
      '/tof';
      // $scope.track.streamUrl  = $sce.trustAsResourceUrl(data.streamUrl);

      if (!!$scope.track.artist.id &&
        ($scope.track.artist.id === Session.getCurrentUser()._id)) {
        $scope.canEdit = true;
      }

      if ($location.path() === '/track/' + $routeParams.trackId + '/edit') {
        $scope.canEdit ? $scope.editing = true : $location.path('track/' +
        $routeParams.trackId);
        if ($scope.editing) {
          $scope.pageDescription = 'Edit this track\'s information';
          $scope.pageTitle = 'Edit Track Information';
        }
      }

      /*
      ** Get the albums pertaining to the track's artist
      ** And update all information relative to current track's album
      */
      getUserAlbums($scope.track.artist.id);

      UsersSvc.get($scope.track.artist.id, function(artist) {
        $scope.track.artist.handle    = artist.handle;
      }, function(err) {
        $log.error('could not fetch track artist: ' +
          $scope.track.artist.id);
      });
    }, function(err) {
      $location.path('/');
    });
  }

  /*
  ** Populate $scope.albums with the current user's albums
  ** when available only when adding a new track.
  ** Otherwise use get the albums by track's artist id
  */
  // if ($scope.creating) {
  //   getUserAlbums(Session.getCurrentUser()._id);
  //   if ($scope.track.coverArt.search('track-coverart-placeholder') !== -1) {
  //     $scope.cover.unique = true;
  //   }
  // }
  /*
  ** Watch $scope.track.album.id to update the coverArt dynamically whenever the album selected changes
  */
  $scope.$watch(function() {
    return $scope.track.album.id;
  }, function(newValue, oldValue) {
    if (newValue !== oldValue) {
      track.album.img = '/assets/albums/' + newValue + '/tof';
      if ($scope.cover.useAlbum /*&& !!coverArts[newValue] */) {
        // $scope.track.coverArt = coverArts[newValue];
        $scope.track.img = '/assets/albums/' + newValue + '/tof';
      }
      $scope.track.album.releaseDate = releaseDates[newValue];
      if (!!!$scope.track.releaseDate ||
        ($scope.track.album.releaseDate < $scope.track.releaseDate)) {
        $scope.track.releaseDate = $scope.track.album.releaseDate;
      }
    }
  });

  /* Indispensable avoir la duree du morceau */
  $scope.$watch(function() {
    return $scope.track.streamUrl;
  }, function(newValue, oldValue) {
    // if (newValue !== oldValue) {
      var audio = new Audio(newValue);
      audio.onloadedmetadata = function() {
        $scope.track.duration = audio.duration;
      };
    // }
  });

  $scope.$watch(function() {
    return $scope.track.coverArt;
  }, function(newValue) {
    if (newValue.search('album-coverart-placeholder') !== -1) {
      $scope.track.coverArt = newValue.replace('album', 'track');
    }
  });

  $scope.$on(ALBUM.createSuccess, function(event, album) {
    $scope.albums.push(album);
    if (!$scope.track.album.id) {
      releaseDates[album._id]        = new Date(album.releaseDate);
      $scope.track.album.id          = album._id;
      $scope.track.album.title       = album.title;
    }
  });

  $scope.readFile = function(elem) {
    var file    = elem.files[0];
    var reader  = new FileReader();
    reader.onload = function() {
      $scope.$apply(function() {
        /*if (elem.name === 'avatar') {
            $scope.track.imageFile  = file;
            $scope.track.coverArt   = userAddedFile = reader.result;
        }*/
        // Reading large mp3 files causes the browser to crash.
        if (elem.name === 'music') {
          $scope.track.audioFile  = file;
          $scope.track.streamUrl  = $sce.trustAsResourceUrl(reader.result);
        }
      });
    };
    reader.readAsDataURL(file);
  };

  /* This function is a workaround for readFile()
  ** to upload files that are too big to read
  */
  $scope.getFile = function(elem) {
    $scope.track.audioFile = elem.files[0];
  };

  $scope.addToPlaylist = function(playlist) {
    PlaylistsSvc.addTrack(playlist, $scope.track);
  };

  $scope.play = function(track) {
    QueueSvc.playNow(track);
  };

  $scope.addToQueue = function(track) {
    QueueSvc.addTrack(track);
  };

  $scope.create = function(track) {
    track.artist.id = Session.getCurrentUser()._id;
    delete track.streamUrl;
    TracksSvc.create(track, function(createdTrack) {
      $rootScope.$broadcast(TRACK_EVENTS.createSuccess, createdTrack);
      MessageSvc.addMsg('success',
        'You have successfully added a new track!');
      $location.path('track/' + createdTrack._id);
    }, function(err) {
      $rootScope.$broadcast(TRACK_EVENTS.createFailed, err);
      MessageSvc.addMsg('danger',
        'Something went wrong trying to upload your new track!');
    });
  };

  $scope.update = function(track) {
    delete track.streamUrl;
    TracksSvc.update(track, function(updatedTrack) {
      $rootScope.$broadcast(TRACK_EVENTS.updateSuccess, updatedTrack);
      MessageSvc.addMsg('success',
        'You have successfully updated this track!');
      $location.path('track/' + updatedTrack._id);
    }, function(err) {
      $rootScope.$broadcast(TRACK_EVENTS.updateFailed, err);
      MessageSvc.addMsg('danger',
        'Something went wrong trying to update your track\'s info!');
    });
  };

  $scope.delete = function(track) {
    TracksSvc.delete(track, function(deletedTrack) {
      $rootScope.$broadcast(TRACK_EVENTS.deleteSuccess);
      MessageSvc.addMsg('success',
        'You have successfully deleted the track!');
      $location.path('/album/' + deletedTrack.album.id);
    }, function(err) {
      $rootScope.$broadcast(TRACK_EVENTS.deleteFailed);
      MessageSvc.addMsg('danger',
        'Something went wrong trying to delete your track!');
    });
  };

  $scope.updateCoverArt = function(unique) {
    if (!unique) {
      // $scope.track.coverArt = coverArts[$scope.track.album.id];
      $scope.track.img = '/assets/albums/' + $scope.track.album.id + '/tof';
    } else {
      // $scope.track.coverArt = userAddedFile;
      $scope.track.img = userAddedFile;
    }
  };

  $scope.updateCoverImage = function(image) {
    $scope.track.imageFile = image.file;
    $scope.track.coverArt  = userAddedFile = image.url;
    $scope.track.img = image.url;
  };

  $scope.download = function(track) {
    TracksSvc.downloadLink(track, function(downloadUrl) {
      $rootScope.$broadcast(TRACK_EVENTS.downloadSuccess);
    }, function() {
      $rootScope.$broadcast(TRACK_EVENTS.downloadFailed);
      MessageSvc.addMsg('danger', 'Download failed!');
    });
  };

  $scope.edit = function() {
    $location.path('/track/' + $scope.track._id + '/edit');
  };
}]);
