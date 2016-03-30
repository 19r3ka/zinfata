app.controller('headerCtrl', ['$scope', '$rootScope', 'AUTH', 'SessionSvc',
  'MessageSvc', 'AuthenticationSvc', '$location', '$log', 'USER_EVENTS',
  function($scope, $rootScope, AUTH, Session, MessageSvc, Auth, $location,
  $log, USER) {

  $scope.loggedIn = Auth.isAuthenticated;
  $scope.user     = Session.getCurrentUser();

  $scope.$watch(function() {
    return Auth.isAuthenticated();
  }, function(newVal, oldVal) {
    if (newVal !== oldVal) {
      refresh();
    }
  });

  $scope.$on(USER.deleteSuccess, function() {
    $scope.logout();
  });

  $scope.userProfile = function(user) {
    var uri  = '#';

    if (!!user && '_id' in user && user._id) {
      uri = 'user/' + user._id;
    }
    return uri;
  };

  $scope.userSettings = function(user) {
    return '#';
  };

  $scope.logout = function() {
    Auth.logout(function(res) {
      if (res) {
        MessageSvc.addMsg('success', 'You have been successfully logged out!');
        $rootScope.$broadcast(AUTH.logoutSuccess);
      } else {
        MessageSvc.addMsg('danger', 'Issue with the logout process!');
        Session.destroy();
        $rootScope.$broadcast(AUTH.logoutFailed);
      }
      $location.path('/login');
    });
  };

  function refresh() {
    if ($scope.loggedIn) {
      $scope.user = Session.getCurrentUser();
    }
  }
}]);
