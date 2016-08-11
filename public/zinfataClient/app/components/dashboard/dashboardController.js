app.controller('dashboardCtrl', ['$scope', 'TracksSvc', 'SessionSvc', '$log',
'QueueSvc', '$window', function($scope, Tracks, Session, $log, Queue, $window) {
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
    });
    $scope.tracks = latest;
  }, function(err) {
    $log.error(err);
  });

  $scope.play = function(track) {
    Queue.playNow(track);
  };

  $scope.addToQueue = function(track) {
    Queue.addTrack(track);
  };

  $window.location.href='/coming_soon';
}]);
