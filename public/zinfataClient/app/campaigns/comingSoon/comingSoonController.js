app.controller('comingSoonCtrl', ['$scope', 'InvitationsSvc', '$log', '$timeout',
'$window', function(scope, Invitations, log, $timeout, $window) {

  /* Switch for invitation demand and code validation forms */
  function gotCode(boolean, event) {
    event.preventDefault(); //link won't navigate
    scope.hasCode = boolean;
  }

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


  /* Sends the invitation request to server */
  function request(invitation) {
    invitation.medium = 'email';
    scope.loading = true;
    Invitations.create(invitation, function(newInvite) {
      notify('success', 'Demande reçu. Ton code d\'invitation suivra bientôt.');
      scope.loading = false;
    }, function(err) {
      notify('error', 'Un problème est survenu. Réessayez un peu plus tard.', err);
      scope.loading = false;
    });
  }

  /* Takes a validation code and validates it */
  function validate(code) {
    scope.loading = true;
    Invitations.validate(code, function(invitation) {
      notify('success', 'Code accepté. Bienvenue sur Zinfata');
      scope.loading = false;
      Invitations.setCookie(invitation.cookie);Connexion

      $window.location.href = '/register';
    }, function(err) {
      scope.loading = false;
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
