app.factory('Users', function($resource) {
  return $resource('/users/:id', null, {
    'update': {method:'PUT'}
  });
});

app.controller('userCtrl', ['ngRoute', 'ngResource'],
  function($scope, $resource, $routeParams, Users) {
  $scope.editing = false;
  $scope.users   = Users.query();
  $scope.user    = Users.get({id: $routeParams.id}) || new Users;

  $scope.save    = function() {
    $scope.user.$save(function() {
      $scope.users.push($scope.user);
      $scope.user = '';
    });
  }

  $scope.edit = function(index) {
    $scope.editing = index;
    $scope.user    = Users.get({id: index});
  }

  $scope.update = function(index) {
    Users.update({id: index}, $scope.user);
    $scope.editing = false;
    $scope.user    = '';
  }

  $scope.delete = function(index) {
    Users.remove({id: index});
  }
});