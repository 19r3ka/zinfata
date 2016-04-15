app.controller('dashboardCtrl', ['$scope', 'TracksSvc', 'SessionSvc', '$log',
function($scope, Tracks, Session, $log) {
  $scope.tracks = [];
  $scope.loggedIn = function() {
    return !!Session.getCurrentUser();
  };
  Tracks.latest(function(tracks) {
    $scope.tracks = tracks;
  }, function(err) {
    $log.debug(err);
  });
}]);
