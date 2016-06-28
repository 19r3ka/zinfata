app.controller('queueCtrl', ['$scope', '$rootScope', '$log', 'QueueSvc',
'TracksSvc', 'AUDIO', function($scope, $rootScope,
$log, QueueSvc, TracksSvc, AUDIO) {
  $scope.musicPlaying = musicPlaying;
  $scope.queue = {
    duration: 0,
    tracks: [],
    playPause: playPause,
    removeTrack: removeTrackAt
  };

  /* Sync viewModel with localStore queue list */
  $scope.$on(AUDIO.playNow, function(event, track) {
    sync();
  });

  $scope.$on(AUDIO.load, function(event, track) {
    sync();
  });

  function addToDuration(duration) {
    $scope.queue.duration += duration;
  }

  function getDuration(queue) {
    return $scope.queue.duration;
  }

  function musicPlaying($index, trackId) {
    // TODO: check soundManager to see if music is in fact playing
    if ($index === 0) {
      var sound = soundManager.getSoundById('sound_' + trackId);
      if (!sound || (sound && !sound.playState)) {
        return false;
      }
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

    if (0 === index) {
      $rootScope.$broadcast(AUDIO.playPause);
    } else {
      QueueSvc.playNow($scope.queue.tracks[index], index);
    }
  }

  /*
   * Keeps deleting items in array starting at index
   * until it finds a match with val
  */
  // TODO: removed should be a flat array of all removed items
  function recursiveRemove(array, val, index) {
    var removed;
    var length = array.length;
    if (val === array[index]._id || index >= length) {
      return removed.length;
    }

    removed = array.splice(index, 1);
    index = index++;
    recursiveRemove(array, val, index);
  }

  function removeTrackAt(index) {
    // Don't remove the nowPlaying track if there none other to load
    if (QueueSvc.getTracks().length <= 1 && index === 0) {
      $log.error('This track is the currently loaded');
      return;
    }

    QueueSvc.removeTrackAt(index, function(track) {
      var removed;
      var tracks;
      if (!track) {
        $log.error('QueueSvc: couldn\'t remove track at: %s', index);
        return;
      }

      removed = $scope.queue.tracks.splice(index, 1);
      if (!removed.length) {
        $log.error('QueueController: couldn\'t splice out item at: %s', index);
        return;
      }

      // if we are deleting currently playing track, load next in line.
      if (index === 0) {
        tracks = QueueSvc.load(0);
      }

      updateQueueDuration();
    });
  }

  function resetQueue() {
    $scope.queue.tracks = [];
    $scope.queue.duration = 0;
  }

  /*
   * Syncs scope's tracks with queue tracklist
  */
  function sync() {
    resetQueue();
    var trackIndexes = QueueSvc.getTracks();
    $scope.queue.tracks = [];
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

  function updateQueueDuration() {
    $scope.queue.duration = 0;
    angular.forEach($scope.queue.tracks, function(track) {
      addToDuration(track.duration);
    });
  }

  sync();
}]);

// (function() {
//   'use strict';

//   angular
//     .module('zinfataClient')
//     // .controller('queueController', queueController);
//     .controller('queueCtrl', queueController);

//   queueController.$inject = ['$scope', '$rootScope', '$log', 'QueueSvc',
//   'TracksSvc', 'AUDIO'];

//   function queueController($scope, $rootScope,
//   $log, QueueSvc, TracksSvc, AUDIO) {
//     /* jshint validthis: true */
//     var vm = this;

//     vm.musicPlaying = musicPlaying;
//     vm.queue = {
//       duration: 0,
//       tracks: [],
//       playPause: playPause,
//       removeTrack: removeTrackAt
//     };

//     /* Sync viewModel with localStore queue list */
//     $scope.$on(AUDIO.playNow, function(event, track) {
//       sync();
//     });

//     function addToDuration(duration) {
//       vm.queue.duration += duration;
//     }

//     function getDuration(queue) {
//       return vm.queue.duration;
//     }

//     function musicPlaying($index, trackId) {
//       // TODO: check soundManager to see if music is in fact playing
//       if ($index === 0) {
//         var sound = soundManager.getSoundById('sound_' + trackId);
//         if (!sound || (sound && !sound.playState)) {
//           return false;
//         }
//         return true;
//       }
//       return false;
//     }

//     function parseDuration(duration) {
//       duration = parseInt(duration);
//       return angular.isNumber(duration) ? duration : 0;
//     }

//     function playPause(event, index) {
//       event.preventDefault();

//       if (0 === index) {
//         $rootScope.$broadcast(AUDIO.playPause);
//       } else {
//         QueueSvc.playNow(vm.queue.tracks[index], index);
//       }
//     }

//     function removeTrackAt(index) {
//       QueueSvc.removeTrackAt(index, function(track) {
//         if (!track) {
//           $log.error(
//             'QueueSvc: couldn\'t remove track at: %s',
//             index
//           );
//           return;
//         }

//         var removed = vm.queue.tracks.splice(index, 1);
//         if (!removed.length) {
//           $log.error(
//             'QueueController: couldn\'t splice out item at: %s',
//             index
//           );
//           return;
//         }
//         updateQueueDuration();
//       });
//     }

//     function resetQueue() {
//       vm.queue.tracks = [];
//       vm.queue.duration = 0;
//     }

//     /*
//      * Syncs scope's tracks with queue tracklist
//     */
//     function sync() {
//       resetQueue();
//       var trackIndexes = QueueSvc.getTracks();
//       vm.queue.tracks = [];
//       // fetch each track by trackId in queue
//       if (!!trackIndexes.length) {
//         angular.forEach(trackIndexes, function(trackId, index) {
//           var tracks = this;
//           if (typeof trackId === 'string') {
//             TracksSvc.get(trackId, function(track) {
//               addToDuration(track.duration);
//               tracks[index] = track;
//             }, function(err) {});
//           }
//         }, vm.queue.tracks);
//       }
//     }

//     function updateQueueDuration() {
//       vm.queue.duration = 0;
//       angular.forEach(vm.queue.tracks, function(track) {
//         addToDuration(track.duration);
//       });
//     }

//     sync();
//   }
// })();
