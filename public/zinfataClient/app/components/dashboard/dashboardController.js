app.controller('dashboardCtrl', ['$scope', 'Users', 'UsersSvc', function($scope, Users, UsersSvc) {
    $scope.users = UsersSvc.users;
    $scope.delete = function(user) {
      UsersSvc.delete(user._id);
    };
}]);
