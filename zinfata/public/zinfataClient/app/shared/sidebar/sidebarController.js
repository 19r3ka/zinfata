app.controller('sidebarCtrl', ['$scope', '$log', 'PlaylistsSvc', 'UsersSvc', 'AUTH_EVENTS',
                                function($scope, $log, PlaylistsSvc, UsersSvc, AUTH_EVENTS) {
    var currentUser  = UsersSvc.getCurrentUser(),
        params       = {owner: ''};

    $scope.$watch(function() { return UsersSvc.getCurrentUser(); },  function(newVal, oldVal){
        if(newVal !== oldVal) {
            currentUser     = UsersSvc.getCurrentUser();
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
    })
}]);
