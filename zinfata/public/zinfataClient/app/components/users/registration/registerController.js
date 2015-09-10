app.controller('registerCtrl', function($scope, UsersService) {
  $scope.user     = {};
  $scope.register = function() {
    UsersService.create($scope.user);
  };
});
