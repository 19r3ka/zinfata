app.controller('registerCtrl', ['$scope', 'UsersSvc', 'MessageSvc', '$location', 
                               function($scope, UsersSvc, MessageSvc, $location) {
  $scope.user     = {
    firstName: '',
    lastName:  '',
    handle:    '',
    email:     '',
    password:  ''   
  };

  $scope.register = function() {
    UsersSvc.create($scope.user, function(saved_user) {
        MessageSvc.addMsg('success', 'Welcome to Zinfata, ' + saved_user.firstName + '. Check the email we sent you to activate your account');
        $scope.registForm.$setPristine();
    }, function(err) {
        MessageSvc.addMsg('danger', 'Oops, we were unable to register you!');
    });
  };
}]);
