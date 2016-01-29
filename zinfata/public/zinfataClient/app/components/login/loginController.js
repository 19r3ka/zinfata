app.controller('loginCtrl', ['$scope', '$rootScope', 'AUTH', 'AuthenticationSvc', 'MessageSvc', '$location', '$log',
               function($scope, $rootScope, AUTH, AuthSvc, MessageSvc, $location, $log) {
  $scope.credentials = {
    handle:   '',
    password: ''
  };
  
  $scope.authenticate = function(credentials) {
    /*Authenticate the user with the server.
      returns access token. */
    AuthSvc.login(credentials, function(user) {
      MessageSvc.addMsg('success', 'You are now logged in as ' + user.handle);
      $scope.credentials = {};
      $scope.loginForm.$setPristine();
      $location.path('/dashboard');
    }, function(err) {
      MessageSvc.addMsg('danger', 'Login failed! Try again later.');
      $location.path('/login?failure');
    });
  };
}]);
