app.controller('registerCtrl', ['$scope', 'UsersSvc', function($scope, UsersSvc) {
  $scope.user     = {};
  $scope.register = function() {
    UsersSvc.create($scope.user);
  };
}]);
