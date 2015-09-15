app.controller('registerCtrl', function($scope, UsersSvc) {
  $scope.user     = {};
  $scope.register = function() {
    UsersSvc.create($scope.user);
  };
});
