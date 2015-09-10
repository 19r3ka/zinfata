app.controller('registerCtrl', function($scope, UsersService) {
  $scope.user     = {};
  $scope.register = function() {
    alert('It is working!');
    //UsersService.create($scope.user);
  };
});
