app.controller('queueCtrl', ['$scope', '$rootScope', '$log', 'QueueSvc',
'TracksSvc', 'UsersSvc', 'AlbumsSvc', 'AUDIO', function($scope, $rootScope,
$log, QueueSvc, TracksSvc, UsersSvc, AlbumsSvc, AUDIO) {
  $scope.musicPlaying = musicPlaying;
  $scope.queue = {
    duration: 0,
    tracks: [],
    playPause: playPause,
    removeTrack: removeTrackAt
  };

  // $scope.$watch(function() {
  //   return $scope.queue.tracks.length;
  // }, function(newVal, oldVal) {
  //   if (newVal !== oldVal) {
  //     updateQueueDuration();
  //   }
  // });

  /* Sync viewModel with localStore queue list */
  $scope.$on(AUDIO.set, function(event, track) {
    sync();
  });

  function addToDuration(duration) {
    $scope.queue.duration += duration;
  }

  function getDuration(queue) {
    return $scope.queue.duration;
  }

  function init() {
    var trackIndexes = QueueSvc.getTracks();
    // fetch each track by trackId in queue
    if (!!trackIndexes.length) {
      angular.forEach(trackIndexes, function(trackId, index) {
        var tracks = this;
        if (typeof trackId === 'string') {
          TracksSvc.get(trackId, function(track) {
            addToDuration(track.duration);
            tracks[index] = track;
          }, function(err) {});
        }
      }, $scope.queue.tracks);
    }
  }

  function musicPlaying($index, trackId) {
    var sound = soundManager.getSoundById('sound_' + trackId);
    if (!sound) {
      return false;
    }
    // TODO: check soundManager to see if music is in fact playing
    if ($index === 0 && sound.playState) {
      return true;
    }
    return false;
  }

  function parseDuration(duration) {
    duration = parseInt(duration);
    return angular.isNumber(duration) ? duration : 0;
  }

  function playPause(event, index) {
    event.preventDefault();

    if ($scope.nowLoaded === index) {
      $rootScope.$broadcast(AUDIO.playPause);
    } else {
      QueueSvc.playNow($scope.queue.tracks[index], index);
      $scope.nowLoaded = index;
    }
  }

  /*
   * Keeps deleting items in array starting at index
   * until it finds a match with val
  */
  // TODO: removed should be a flat array of all removed items
  function recursiveRemove(array, val, index) {
    var removed;
    if (val === array[index]) {
      return removed.length;
    }

    removed = array.splice(index, 1);
    recursiveRemove(array, val, index++);
  }

  function removeTrackAt(index) {
    QueueSvc.removeTrackAt(index, function(track) {
      if (!track) {
        $log.error('QueueSvc: couldn\'t remove track at: %s', index);
        return;
      }

      var removed = $scope.queue.tracks.splice(index, 1);
      if (!removed.length) {
        $log.error('QueueController: couldn\'t splice out item at: %s', index);
        return;
      }
      updateQueueDuration();
    });
  }

  function sync() {
    var trackIndexes = QueueSvc.getTracks();
    var tracks       = $scope.queue.tracks;

    angular.forEach(trackIndexes, function(trackId, index) {
      recursiveRemove(tracks, trackId, index);
      updateQueueDuration();
    });
  }

  function updateQueueDuration() {
    $scope.queue.duration = 0;
    angular.forEach($scope.queue.tracks, function(track) {
      addToDuration(track.duration);
    });
  }

  init();
}]);

// (function() {
//   'use strict';

//   angular
//     .module('zClient')
//     .controller('queueController', queueController);

//   queueController.$inject = ['$scope', '$rootScope', '$log', 'QueueSvc',
//   'TracksSvc', 'UsersSvc', 'AlbumsSvc', 'AUDIO'];

//   function queueController($scope, $rootScope,
//   $log, QueueSvc, TracksSvc, UsersSvc, AlbumsSvc, AUDIO) {
//     //content
//   }
// })();
