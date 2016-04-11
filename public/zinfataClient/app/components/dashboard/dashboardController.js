app.controller('dashboardCtrl', ['$scope', 'TracksSvc',
function($scope, Tracks) {
  $scope.tracks = [];
  Tracks.latest(function(tracks) {
    $scope.tracks = tracks;
  }, function(err) {
    $log.debug(err);
  });
  console.log($scope.tracks);
}]);
