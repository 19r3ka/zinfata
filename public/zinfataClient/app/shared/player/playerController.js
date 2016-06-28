app.controller('playerCtrl', ['$scope', '$rootScope',
function($scope, $rootScope) {
  $scope.track = {};

  $scope.$on('AUDIO.playNow', function(track) {
  });
}]);
