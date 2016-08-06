app.controller('invitationCtrl', ['$scope', 'InvitationsSvc', '$log',
  function($scope, InvitationsSvc, $log) {

    /* Add a newly created invitation to the scope's list of invitations */
    function addInvitation(invitation) {
      $scope.invitations.push(invitation);
      $log.debug(invitation);
    }

    InvitationsSvc.getAll(function successCb(array) {
      $scope.invitations = array;
    }, function errorCb(err) {
      $log.error(err);
    });

    $scope.addInvitation = addInvitation;
  }]);
