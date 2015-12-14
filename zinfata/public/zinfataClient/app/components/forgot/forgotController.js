app.controller('forgotCtrl', ['$scope', '$rootScope', '$location', 'MessageSvc', 'Users', 'PWD_TOKEN',
                              function($scope, $rootScope, $location,  MessageSvc, Users, PWD_TOKEN) {
    $scope.email = '';
    $scope.reset = function(email) {
        Users.resetPassword({email: email}, function(res) {
            $rootScope.$broadcast('PWD_TOKEN.sendSuccess');
            MessageSvc.addMsg('success', 'An email has been sent to you with instructions on how to reset your password');
            $scope.email = '';
        }, function(err) {
            $rootScope.$broadcast('PWD_TOKEN.sendFailed');
            MessageSvc.addMsg('danger', 'Something went wrong when trying to verify your email. Try again later!');
        });
    };
}]);
