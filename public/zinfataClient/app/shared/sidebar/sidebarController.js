app.controller('sidebarCtrl', ['$scope', '$log', 'AuthenticationSvc', 'PlaylistsSvc', 'SessionSvc', 'AUTH',
                                function($scope, $log, AuthenticationSvc, PlaylistsSvc, Session, AUTH) {
    var currentUser  = Session.getCurrentUser();
    $scope.isloggedIn = AuthenticationSvc.isAuthenticated;
}]);
