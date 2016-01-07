app.controller('logoutCtrl', ['$rootScope', '$log', 'MessageSvc', 'UsersSvc', 'AUTH_EVENTS',
                              function($rootScope, $log, MessageSvc, UsersSvc, AUTH_EVENTS) {
  Auth.logout(function() {
    UsersSvc.setCurrentUser({});
    $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
    MessageSvc.addMsg('success', 'You have been successfully logged out!');
  }, function(err) {
    MessageSvc.addMsg('danger', 'We couldn\'t log you out. Try again later!');
  });
}]);
