app.controller('logoutCtrl', ['$rootScope', '$log', 'MessageSvc', 'UsersSvc', 'AUTH_EVENTS',
                              function($rootScope, $log, MessageSvc, UsersSvc, AUTH_EVENTS) {
  Auth.logout(function(data) {
    $log.debug('we entered the successful loop on logout');
    MessageSvc.addMsg('success', 'You have been successfully logged out!');
    UsersSvc.currentUser = {};
    $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
  }, function(err) {
    $log.debug('we entered the failure loop on logout');
    MessageSvc.addMsg('danger', 'We couldn\'t log you out. Try again later!');
    $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
  });
}]);
