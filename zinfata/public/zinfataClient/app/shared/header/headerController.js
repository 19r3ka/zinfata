app.controller('headerCtrl', ['$scope', '$rootScope', 'AUTH', 'SessionSvc', 'MessageSvc', 'AuthenticationSvc', '$location', '$log',
                              function($scope, $rootScope, AUTH, Session, MessageSvc, Auth, $location, $log) {
  $scope.loggedIn = Auth.isAuthenticated();
  $scope.user     = Session.getCurrentUser();

  $scope.$watch(function() {
    var user = Session.getCurrentUser();
    if(user && '_id' in user) {
      return true;
    } 
    return false; 
  },  function(newVal, oldVal){
    if(newVal !== oldVal) {
      $scope.user     = Session.getCurrentUser();
      $scope.loggedIn = Auth.isAuthenticated();
    }
  });

  $scope.$on(AUTH.logoutSuccess, function() {
    $scope.loggedIn = false;
  });

  $scope.userProfile = function(user) {
    var uri  = '#';

    if(!!user && '_id' in user && user._id) uri = 'user/' + user._id;
    return uri;
  };

  $scope.userSettings = function(user) {
    return '#';
  };

  $scope.logout = function() {
    Auth.logout(function(res) {
      if(res) {
        MessageSvc.addMsg('success', 'You have been successfully logged out!');
        $rootScope.$broadcast(AUTH.logoutSuccess);
      } else {
        MessageSvc.addMsg('danger', 'Failed to log out!');
        $rootScope.$broadcast(AUTH.logoutFailed);
      }
    });
  };
}]);
