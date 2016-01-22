app.controller('sidebarCtrl', ['$scope', '$log', 'PlaylistsSvc', 'SessionSvc', 'AUTH_EVENTS',
                                function($scope, $log, PlaylistsSvc, Session, AUTH_EVENTS) {
    var currentUser  = Session.getCurrentUser(),
        params       = {owner: ''};

    $scope.$watch(function() { return Session.getCurrentUser(); },  function(newVal, oldVal){
        if(newVal !== oldVal) {
            currentUser     = Session.getCurrentUser();
            if('_id' in currentUser && !!currentUser._id) params.owner = currentUser._id;

            PlaylistsSvc.find(params, function(data){
                $scope.playlists = data;
            }, function(err) {
                $scope.playlists = [];
            });

        }
    });

    $scope.$on(AUTH_EVENTS.logoutSuccess, function() {
        $scope.playlists = [];
    });
}]);
