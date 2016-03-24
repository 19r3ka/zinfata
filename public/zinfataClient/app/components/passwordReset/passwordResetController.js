app.controller('passwordResetCtrl', ['$scope', '$log', '$rootScope', 'UsersSvc', 'Users', '$location', 'MessageSvc', 'USER_EVENTS', 'PWD_TOKEN', '$routeParams',
                                     function($scope, $log, $rootScope, UsersSvc, Users, $location, MessageSvc, USER_EVENTS, PWD_TOKEN, $routeParams) {
    $scope.credentials = {
      password: '',
      passwordConfirmation: '',
      token: ''
    };
    $scope.validated = false;

    $scope.verify = function(token) {
        Users.verifyToken({token: token}, function(res) {
            $rootScope.$broadcast(PWD_TOKEN.verificationSuccess);
            $scope.validated = true;
        }, function(err) {
            $rootScope.$broadcast(PWD_TOKEN.verificationFailed);
            MessageSvc.addMsg('danger', 'The verification token is either invalid or expired. Request a new one!');
        });
    };

    $scope.update = function(credentials) {
      if(!!credentials.token && credentials.password === credentials.passwordConfirmation) {
        Users.verifyToken({token: credentials.token, get_user: true }, function(res) {
          UsersSvc.update({password: credentials.password, _id: res.userId}, function(res) {
            $log.debug(angular.toJson(res));
            $rootScope.$broadcast(USER_EVENTS.updateSuccess);
            MessageSvc.addMsg('success', 'Password successfully updated. Log in now');
            $location.path('login');
          }, function(err) {
            $rootScope.$broadcast(USER_EVENTS.updateFailed);
            MessageSvc.addMsg('danger', 'Something went wrong when trying to update your password!')
          });
        });
      }
    };

    if($routeParams.token) {
      $scope.credentials.token = $routeParams.token;
      $scope.verify($scope.credentials.token);
    }
}]);
