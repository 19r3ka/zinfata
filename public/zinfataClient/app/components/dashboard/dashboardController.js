app.controller('dashboardCtrl', ['$scope', 'TracksSvc', 'SessionSvc', '$log',
'QueueSvc', function($scope, Tracks, Session, $log, Queue) {
  $scope.tracks = [];
  $scope.loggedIn = function() {
    return !!Session.getCurrentUser();
  };
  Tracks.latest(function(tracks) {
    var latest = []
    angular.forEach(tracks, function(track) {
      track.img = '/assets/tracks/' + track._id + '/tof';
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
