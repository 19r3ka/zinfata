app.controller('comingSoonCtrl', ['$scope', 'InvitationsSvc', '$log', '$timeout',
function(scope, Invitations, log, $timeout) {

  function notify (outcome, message, response) {
    var text = message;
    var icon = 'fa-exclamation';

    if (outcome === 'error') {
      icon = 'fa-error';
      text = 'Oups. Une erreur est survenu. réessayez plus tard!';
      log.error(text + ' : ' + response);
    } else {
      log.info(text);
    }

    scope.message = {
      icon: icon,
      type: outcome,
      text: text
    }

    // $timeout
  }

  /* Sends the invitation request to server */
  function request(invitation) {
    invitation.medium = 'email';
    Invitations.create(invitation, function(newInvite) {
      notify('success', 'Demande reçu. Ton code d\'invitation suivra bientôt.')
    }, function(err) {
      notify('error', err);
    });
  }

  /* Takes a validation code and validates it */
  function validate(code) {
    Invitations.isValid(code, function(validity) {
      return validity;
    });
  }

  scope.request = request;
}]);
