app.controller('dashboardCtrl', ['$scope', 'TracksSvc', 'SessionSvc', '$log',
'QueueSvc', function($scope, Tracks, Session, $log, Queue) {
  $scope.tracks = [];
  $scope.loggedIn = function() {
    return !!Session.getCurrentUser();
  };
  Tracks.latest(function(tracks) {
    $scope.tracks = tracks;
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
