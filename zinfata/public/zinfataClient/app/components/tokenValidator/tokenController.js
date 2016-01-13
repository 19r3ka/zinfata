app.controller('tokenCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'Users', 'MessageSvc', 'PWD_TOKEN', 'USER_EVENTS',
                            function($scope, $rootScope, $routeParams, $location, Users, MessageSvc, PWD_TOKEN, USER_EVENTS) {
    
    var token = $routeParams.token;
    $scope.email = '';

    Users.verifyToken({token: token}, function(res) {
        $rootScope.$broadcast(USER_EVENTS.accountActivated);
        MessageSvc.addMsg('success', 'Account successfully activated. Log in now to access all the music!');
        $location.path('login');
    }, function(err) {
        $rootScope.$broadcast(PWD_TOKEN.verificationFailed);
        MessageSvc.addMsg('danger', 'That activation link is no longer valid. Please, request a new one!');
    });

    $scope.activate = function(email) {
        Users.activate({ email: email }, function(res) {
            $rootScope.$broadcast(PWD_TOKEN.sendSuccess);
            MessageSvc.addMsg('success', 'Great. We just sent you a new email with the link to activate your account!');
        }, function(err) {
            $rootScope.$broadcast(PWD_TOKEN.sendFailed);
            MessageSvc.addMsg('danger', 'We couldn\'t send you a new email at the moment. Try again later.');
        });
    };
}]);
