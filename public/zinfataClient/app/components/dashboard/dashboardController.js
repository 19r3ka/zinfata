app.controller('dashboardCtrl', ['$scope', 'TracksSvc',
function($scope, Tracks) {
  $scope.tracks = Tracks.latest;
}]);
