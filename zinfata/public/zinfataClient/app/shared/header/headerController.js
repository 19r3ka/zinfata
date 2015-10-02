app.controller('headerCtrl', ['$scope', '$rootScope', 'AUTH_EVENTS', 'UsersSvc', 'Auth', '$log',
                              function($scope, $rootScope, AUTH_EVENTS, UsersSvc, Auth, $log) {
  $scope.loggedIn = Auth.isAuthenticated();
  $scope.username = UsersSvc.getCurrentUser().firstName;

  $scope.$watch(function() { return UsersSvc.getCurrentUser(); }, function(newVal, oldVal) {
    $scope.username = UsersSvc.getCurrentUser().firstName;
  });

  $scope.$on(AUTH_EVENTS.loginSuccess, function() {
    $scope.loggedIn = true;
  });

  $scope.$on(AUTH_EVENTS.logoutSuccess, function() {
    $scope.loggedIn = false;
  });

  $scope.logout = function() {
    Auth.logout();
    $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
  };
}]);
