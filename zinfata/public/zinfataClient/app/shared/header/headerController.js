app.controller('headerCtrl', ['$scope', '$rootScope', 'AUTH_EVENTS', 'UsersSvc', 'MessageSvc', 'Auth', '$log',
                              function($scope, $rootScope, AUTH_EVENTS, UsersSvc, MessageSvc, Auth, $log) {
  $scope.loggedIn = Auth.isAuthenticated();
  $scope.username = UsersSvc.getCurrentUser().firstName;

  $scope.$watch(function() { return UsersSvc.getCurrentUser(); }, function(newVal, oldVal) {
    $scope.username = UsersSvc.getCurrentUser().firstName;
    $scope.loggedIn = Auth.isAuthenticated();
  });

  $scope.$on(AUTH_EVENTS.loginSuccess, function() {
    $scope.loggedIn = Auth.isAuthenticated();
  });

  $scope.$on(AUTH_EVENTS.logoutSuccess, function() {
    $scope.loggedIn = Auth.isAuthenticated();
  });

  $scope.logout = function() {
    Auth.logout(function(data) {
      MessageSvc.addMsg('success', 'You have been successfully logged out!');
      UsersSvc.currentUser = {}; //reset currentUser if successfully logged out!
      $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
    }, function() {
      MessageSvc.addMsg('danger', 'We couldn\'t log you out. Try again later!');
      $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
    });
  };
}]);
