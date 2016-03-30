app.controller('loginCtrl', ['$scope', '$rootScope', 'AUTH',
'AuthenticationSvc', 'MessageSvc', '$location', '$log', function($scope,
$rootScope, AUTH, AuthSvc, MessageSvc, $location, $log) {
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
      $location.path('dashboard');
    }, function(err) {
      if (err === 'mustActivateAccount') {
        MessageSvc.addMsg('danger',
          'You must activate your account to access all the music.' +
          'Check the email we sent you for the activation link.' +
          'Or enter your email address below to have us send you' +
          ' a new validation link.');
        AuthSvc.logout(function() {});
        $location.path('register/activate');
      } else {
        MessageSvc.addMsg('danger', 'Login failed! Try again later.');
        $location.path('login?failure');
      }
    });
  };
}]);
