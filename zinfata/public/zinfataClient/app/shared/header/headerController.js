app.controller('headerCtrl', ['$scope', 'UsersSvc', function($scope, UsersSvc) {
  $scope.user  = UsersSvc.currentUser;
  $scope.loggedIn = UsersSvc.loggedIn;
}]);
