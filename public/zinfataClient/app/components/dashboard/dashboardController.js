app.controller('dashboardCtrl', ['$scope', 'TracksSvc', 'SessionSvc', '$log',
'QueueSvc', function($scope, Tracks, Session, $log, Queue) {
  $scope.tracks = [];
  $scope.loggedIn = function() {
    return !!Session.getCurrentUser();
  };
  Tracks.latest(function(tracks) {
    var latest = [];
    var id     = 0; 
    angular.forEach(tracks, function(track) {
      track.id = id++;
      track.img = '/assets/tracks/' + track._id + '/tof';
      track.url = '/assets/tracks/' + track._id + '/zik';
      latest.push(track);
    })
    $scope.tracks = latest;
  }, function(err) {
    $log.debug(err);
  });

  $scope.play = function(track) {
    Queue.playNow(track);
  };

  $scope.addToQueue = function(track) {
    Queue.addTrack(track);
  };
}]);
