app.controller('playlistCtrl', ['$scope', '$rootScope', '$location', '$log',
'$routeParams', 'AlbumsSvc', 'TracksSvc', 'UsersSvc', 'SessionSvc',
'PlaylistsSvc', 'MessageSvc', 'QueueSvc' ,'PLAYLIST_EVENTS', function($scope,
$rootScope, $location, $log, $routeParams, AlbumsSvc, TracksSvc, UsersSvc,
Session, PlaylistsSvc, MessageSvc, QueueSvc, PLAYLIST_EVENTS) {

  $scope.playlist = {
    title:    '',
    owner:   {
      id:   '',
      handle: ''
    },
    tracks:  []
  };
  $scope.playlistTracks = []; // array of inflated track metadata objects
  $scope.canEdit        = false;
  $scope.creating       = false;
  $scope.editing        = false;

  $scope.pageTitle       = 'Add New Playlist';
  $scope.pageDescription = 'Find and share your favorite tracks easily.';

  if ($location.path() === '/playlist/new') {
    $scope.creating = true;
  }

  if (!!$routeParams.playlistId) {
    PlaylistsSvc.get($routeParams.playlistId, function(data) {
      data.duration = 0;
      if (!!data.owner.id && (data.owner.id === Session.getCurrentUser()._id)) {
        $scope.canEdit = true;
      }

      if ($location.path() === '/playlist/' + $routeParams.playlistId +
        '/edit') {
        $scope.canEdit ? $scope.editing = true : $location.path('/playlist/' +
          $routeParams.playlistId);
        if ($scope.editing) {
          $scope.pageDescription = 'Change this playlist\'s information';
          $scope.pageTitle       = 'Update Playlist';
        }
      }

      /* Populate with owner's data */
      UsersSvc.get(data.owner.id, function(owner) {
        data.owner.handle = owner.handle;
      }, function(err) {
        $log.error('Error getting playlist owner info: ' + err);
      });

      /* If there are tracks, be sure to inflate
      ** each track with album and artist info. */
      if (!!data.tracks.length) {
        var duration = 0;
        angular.forEach(data.tracks, function(trackId, index) {
          if (typeof trackId === 'string') {
            TracksSvc.inflate(trackId, $scope.playlistTracks, function(track) {
              duration = parseInt(track.duration);
              if (!angular.isNumber(duration)) {
                duration = 0;
              }
              data.duration += duration;
            }, function(err) {});
          }
        });
      }

      // Only assign the metadata to the scope playlist at the very end!
      $scope.playlist = data;
      // $scope.playlistTracks = data.tracks;
    }, function(err) {
      $location.path('/');
    });
  }

  $scope.edit = function() {
    $location.path('/playlist/' + $scope.playlist._id + '/edit');
  };

  $scope.removeTrack = function(index) {
    PlaylistsSvc.removeTrack($scope.playlist, index, function(updatedPlaylist) {
      $scope.playlistTracks.splice(index, 1);
    }, function(err) {
      $rootScope.$broadcast(PLAYLIST_EVENTS.updateFailed);
    });
  };

  $scope.play = function(track) {
    QueueSvc.playNow(track);
  };

  $scope.addToQueue = function(track) {
    QueueSvc.addTrack(track);
  };

  $scope.create = function(playlist) {
    playlist.owner.id = Session.getCurrentUser()._id;
    PlaylistsSvc.create(playlist, function(createdPlaylist) {
      $rootScope.$broadcast(PLAYLIST_EVENTS.createSuccess);
      MessageSvc.addMsg('success',
        'You have successfully added a new playlist!');
      $location.path('playlist/' + createdPlaylist._id);
    }, function(err) {
      $rootScope.$broadcast(PLAYLIST_EVENTS.createFailed);
      MessageSvc.addMsg('danger',
        'Something went wrong trying to add your new playlist!');
    });
  };

  $scope.update = function(playlist) {
    PlaylistsSvc.update(playlist, function(updatedPlaylist) {
      $rootScope.$broadcast(PLAYLIST_EVENTS.updateSuccess);
      MessageSvc.addMsg('success',
        'You have successfully updated this playlist!');
      $location.path('playlist/' + updatedPlaylist._id);
    }, function(err) {
      $rootScope.$broadcast(PLAYLIST_EVENTS.updateFailed);
      MessageSvc.addMsg('danger',
        'Something went wrong trying to update your playlist!');
    });
  };

  $scope.delete = function(playlist) {
    PlaylistsSvc.delete(playlist, function(deletedPlaylist) {
      $rootScope.$broadcast(PLAYLIST_EVENTS.deleteSuccess);
      MessageSvc.addMsg('success',
        'You have successfully deleted the playlist!');
      $location.path('/');
    }, function(err) {
      $rootScope.$broadcast(PLAYLIST_EVENTS.deleteFailed);
      MessageSvc.addMsg('danger',
        'Something went wrong trying to delete your playlist!');
    });
  };
}]);
