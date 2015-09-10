app.controller('loginCtrl', function($scope, UsersService) {
  $scope.login   = {
    handle:   '',
    password: ''
  };
  $scope.authenticate    = function() {
    UsersService.login($scope.login);
  };
})
