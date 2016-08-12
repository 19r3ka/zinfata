app.controller('registerCtrl', ['$scope', 'UsersSvc', 'MessageSvc',
'$location', '$window', 'InvitationsSvc',
function($scope, UsersSvc, MessageSvc, $location, $window, Invitations) {
  $scope.user     = {
    firstName: '',
    lastName:  '',
    handle:    '',
    email:     '',
    password:  ''
  };

  $scope.register = function register() {
    UsersSvc.create($scope.user, function(savedUser) {
      MessageSvc.addMsg('success', 'Welcome to Zinfata, ' +
        savedUser.firstName +
        '. Check the email we sent you to activate your account');
      $scope.user = {};
      $scope.registerForm.$setPristine();
    }, function(err) {
      MessageSvc.addMsg('danger', 'Oops, we were unable to register you!');
    });
  };

  /* Ultimately move this out to the .run function
    to capture verify on route change start instead */
  Invitations.verifyCookie(function(invitation) {
    // Do nothing when the cookie checks out
  }, function(err) {
    // Regardless of code status,
    $window.location.href = '/coming_soon';
  });
}]);
