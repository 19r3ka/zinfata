app.controller('logoutCtrl', ['$rootScope', '$log', 'MessageSvc', 'UsersSvc', 'AUTH',
                              function($rootScope, $log, MessageSvc, UsersSvc, AUTH) {
  Auth.logout(function() {
    UsersSvc.setCurrentUser({});
    $rootScope.$broadcast(AUTH.logoutSuccess);
    MessageSvc.addMsg('success', 'You have been successfully logged out!');
  }, function(err) {
    MessageSvc.addMsg('danger', 'We couldn\'t log you out. Try again later!');
  });
}]);
