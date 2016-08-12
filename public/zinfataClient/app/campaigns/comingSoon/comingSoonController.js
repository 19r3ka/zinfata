app.controller('comingSoonCtrl', ['$scope', 'InvitationsSvc', '$log', '$timeout',
'$window', function(scope, Invitations, log, $timeout, $window) {
  /* Manages message div */
  function notify(outcome, message, response) {
    var text = message;
    var icon = 'fa-exclamation';
    var type = outcome;

    if (outcome === 'error') {
      icon = 'fa-error';
      type = 'danger';
      log.error(text + ' : ' + response);
    } else {
      log.info(text);
    }

    scope.message = {
      icon: icon,
      type: type,
      text: text
    };

    /* Empties message after 5s thus hiding the message box alert */
    $timeout(function() {
      scope.message = {};
    }, 5000);
  }

  /* Switch for invitation demand and code validation forms */
  function gotCode(boolean, event) {
    event.preventDefault(); //link won't navigate
    scope.hasCode = boolean;
  }

  /* Sends the invitation request to server */
  function request(invitation) {
    invitation.medium = 'email';
    Invitations.create(invitation, function(newInvite) {
      notify('success', 'Demande reçu. Ton code d\'invitation suivra bientôt.');
    }, function(err) {
      notify('error', 'Un problème est survenu. Réessayez un peu plus tard.', err);
    });
  }

  /* Takes a validation code and validates it */
  function validate(code) {
    Invitations.validate(code, function(invitation) {
      notify('success', 'Code accepté. Bienvenue sur Zinfata');
      // TODO: Set validation cookie before redirecting to /register page...
      Invitations.setCookie(invitation.cookie);
      $window.location.href = '/register';
    }, function(err) {
      var message;
      if (err.status === 404) {
        message = 'Hmmm, ce code d\'invitation ne semble pas être valide.';
      } else {
        message = 'Un problème est survenu. Réessayez un peu plus tard.';
      }
      notify('error', message, err);
    });
  }

  scope.gotCode =   gotCode;
  scope.request =   request;
  scope.validate =  validate;
}]);
