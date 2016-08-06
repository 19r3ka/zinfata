app.controller('invitationCtrl', ['$scope', 'InvitationsSvc', '$log',
  function ($scope, InvitationsSvc, $log) {

  InvitationsSvc.getAll(function successCb(array) {
    $scope.invitations = array;
  }, function errorCb(err) {
    $log.error(err);
  });

}]);
