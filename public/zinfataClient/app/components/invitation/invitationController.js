app.controller('invitationCtrl', ['$scope', 'invitationsSvc', '$log',
  function ($scope, invitationsSvc, $log) {

  invitationsSvc.getAll(function successCb(array) {
    $scope.invitations = array;
  }, function errorCb(err) {
    $log.error(err);
  });

}]);
