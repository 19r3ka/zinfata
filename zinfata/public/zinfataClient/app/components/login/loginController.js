app.controller('loginCtrl', ['$scope', '$rootScope', 'AUTH_EVENTS', 'Auth', 'UsersSvc', 'MessageSvc', '$location',
               function($scope, $rootScope, AUTH_EVENTS, Auth, UsersSvc, MessageSvc, $location) {
  $scope.credentials = {
    handle:   '',
    password: ''
  };
  $scope.authenticate = function(credentials) {
    Auth.login(credentials, function(res) {
      UsersSvc.setCurrentUser(res);
      MessageSvc.addMsg('success', 'You are now logged in as ' + res.firstName);
      $rootScope.$broadcast(AUTH_EVENTS.loginSuccess, res);
      $scope.credentials = {};
      $location.path('/login?success');
    }, function(err) {
      MessageSvc.addMsg('danger', 'We were unable to log you in!');
      $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
      $location.path('/login?failure');
    });
}}]);
