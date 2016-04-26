app.controller('albumCtrl', ['$scope', '$rootScope', '$location',
'$routeParams', 'SessionSvc', 'TracksSvc', 'QueueSvc', 'AlbumsSvc',
'UsersSvc', 'MessageSvc', 'ALBUM_EVENTS', '$log', function($scope, $rootScope,
$location, $routeParams, Session, Tracks, Queue, AlbumsSvc, Users, MessageSvc,
ALBUM_EVENTS, $log) {
  $scope.album = {
    coverArt:    '',
    imageUrl:    'zinfataClient/assets/images/album-coverart-placeholder.png',
    title:       '',
    artist: {
      id:        ''
    },
    about:       '',
    releaseDate: ''
  };
  $scope.editing  = false;
  $scope.creating = false;
  $scope.canEdit  = false;

  $scope.pageTitle = 'Add New Album';
  $scope.pageDescription = 'Quickly upload a new album to Zinfata.';

  if ($location.path() === '/album/new') {
    $scope.creating = true;
  }

  if ($routeParams.albumId) {
    AlbumsSvc.get($routeParams.albumId, function(data) {
      $scope.album             = data;
      $scope.album.duration    = 0;
      $scope.album.trackLength = 0;
      var duration             = 0;

      if (!!$scope.album.artist.id &&
      ($scope.album.artist.id === Session.getCurrentUser()._id)) {
        $scope.canEdit = true;
      }
      if ($location.path() === '/album/' + $routeParams.albumId + '/edit') {
        $scope.canEdit ? $scope.editing = true : $location.path('album/' +
          $routeParams.albumId);
        if ($scope.editing) {
          $scope.pageTitle = 'Edit Album Info';
          $scope.pageDescription = 'Edit this album basic information.';
        }
      }
      Users.get($scope.album.artist.id, function(user) {
        $scope.album.artist.handle = user.handle;
        $scope.album.artist.avatarUrl = user.avatarUrl;
      }, function(err) {
        $scope.album.artist = 'Unknown';
      });

      Tracks.find({a_id: data._id} , function(tracks) {
        angular.forEach(tracks, function(track) {
          $scope.album.trackLength++;
          duration = parseInt(track.duration);
          if (angular.isNumber(duration)) {
            $scope.album.duration += duration;
          }
        });
      }, function(err) {});
    }, function(err) {
      $location.path('/');
    });
  }

  $scope.edit = function(album) {
    $location.path('/album/' + album._id + '/edit');
  };

  $scope.queueUp = function(album) {
    // Queue.addAlbum
  };

  $scope.play = function(album) {
    // Queue.addAlbum(album, playNow)
  };

  $scope.create = function(album) {
    if (!album.artist.id) {
      album.artist.id = Session.getCurrentUser()._id;
    }

    AlbumsSvc.create(album, function(createdAlbum) {
      $rootScope.$broadcast(ALBUM_EVENTS.createSuccess);
      MessageSvc.addMsg('success',
        'You have successfully added a new album!');
      $location.path('album/' + createdAlbum._id);
    }, function(err) {
      $rootScope.$broadcast(ALBUM_EVENTS.createFailed);
      MessageSvc.addMsg('danger',
        'Something went wrong trying to create your album!');
    });
  };

  $scope.update = function(album) {
    if ($scope.album.duration) {
      delete $scope.album.duration;
    }

    if ($scope.album.trackLength) {
      delete $scope.album.trackLength;
    }

    if (!album.artist.id) {
      album.artist.id = Session.getCurrentUser()._id;
    }

    AlbumsSvc.update(album, function(updatedAlbum) {
      $rootScope.$broadcast(ALBUM_EVENTS.updateSuccess);
      MessageSvc.addMsg('success',
        'You have successfully updated the album info');
      $scope.editing = false;
      $location.path('album/' + updatedAlbum._id);
    }, function(err) {
      $rootScope.$broadcast(ALBUM_EVENTS.updateFailed);
      MessageSvc.addMsg('danger',
        'Something went wrong trying to update your album!');
    });
  };

  $scope.delete = function(album) {
    AlbumsSvc.delete(album, function() {
      MessageSvc.addMsg('success',
        'The album has been successfully deleted!');
      $rootScope.$broadcast(ALBUM_EVENTS.deleteSuccess);
      $location.path('/user/' + album.artist.id);
    }, function(err) {
      MessageSvc.addMsg('danger',
        'A problem prevented the deletion of your album. Try again later');
      $rootScope.$broadcast(ALBUM_EVENTS.deleteFailed);
    });
  };

  $scope.updateCoverImage = function(image) {
    $scope.album.coverArt = image.file;
    $scope.album.imageUrl = image.url;
  };
}]);
