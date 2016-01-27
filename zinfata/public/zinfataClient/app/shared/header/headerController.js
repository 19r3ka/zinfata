app.controller('headerCtrl', ['$scope', '$rootScope', 'AUTH', 'SessionSvc', 'MessageSvc', 'AuthenticationSvc', '$location',
                              function($scope, $rootScope, AUTH, Session, MessageSvc, Auth, $location) {
  $scope.loggedIn = Auth.isAuthenticated();
  $scope.user     = Session.getCurrentUser();

  $scope.$watch(function() { return Session.getCurrentUser(); },  function(newVal, oldVal){
    if(newVal !== oldVal){
      $scope.user     = newVal;
      $scope.loggedIn = Auth.isAuthenticated();
    }
  });

  $scope.userProfile     = function(user) {
    var uri  = '#';

    if(!!user && '_id' in user && user._id) uri = 'user/' + user._id;
    return uri;
  };

  $scope.userSettings    = function(user) {
    return '#';
  };

  $scope.logout = function() {
    Session.logout(function() {
      MessageSvc.addMsg('success', 'You have been successfully logged out!');
      $rootScope.$broadcast(AUTH.logoutSuccess);
    });
  };
}]);
