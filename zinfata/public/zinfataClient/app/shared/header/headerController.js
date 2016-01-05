app.controller('headerCtrl', ['$scope', '$rootScope', 'AUTH_EVENTS', 'UsersSvc', 'MessageSvc', 'Auth', '$log',
                              function($scope, $rootScope, AUTH_EVENTS, UsersSvc, MessageSvc, Auth, $log) {
  $scope.loggedIn = Auth.isAuthenticated();
  $scope.user     = UsersSvc.getCurrentUser();

  $scope.$watch(function() { return UsersSvc.getCurrentUser(); }, function(newVal, oldVal) {
    $scope.user     = UsersSvc.getCurrentUser();
    $scope.loggedIn = Auth.isAuthenticated();
  });

  $scope.$on(AUTH_EVENTS.loginSuccess, function() {
    $scope.loggedIn = Auth.isAuthenticated();
  });
  $scope.$on(AUTH_EVENTS.logoutSuccess, function() {
    $scope.loggedIn = Auth.isAuthenticated();
  });

  $scope.userProfile     = function(user) {
    return 'user/' + user._id;
  };

  $scope.userSettings    = function(user) {
    return '#';
  };

  $scope.logout = function() {
    Auth.logout(function(data) {
      MessageSvc.addMsg('success', 'You have been successfully logged out!');
      UsersSvc.setCurrentUser = {}; //reset currentUser if successfully logged out!
      $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
    }, function() {
      MessageSvc.addMsg('danger', 'We couldn\'t log you out. Try again later!');
    });
  };
}]);
