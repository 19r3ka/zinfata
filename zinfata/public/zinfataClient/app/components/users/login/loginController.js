app.controller('loginCtrl', ['$scope', 'UsersSvc', function($scope, UsersSvc) {
  $scope.login = {
    handle:   '',
    password: ''
  };
  $scope.authenticate = function() {
    UsersSvc.login($scope.login);
  };
}]);
