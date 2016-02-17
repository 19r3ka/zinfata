app.controller('queueCtrl', ['$scope', '$rootScope', '$log', 'QueueSvc', 'TracksSvc', 'UsersSvc', 'AlbumsSvc',
                            function($scope, $rootScope, $log, QueueSvc, TracksSvc, UsersSvc, AlbumsSvc) {
    $scope.queueTracks = [];
    var trackIndexes   = QueueSvc.getTracks();
    
    /* If there are tracks, be sure to inflate 
    ** each track with album and artist info.*/ 
    if(!!trackIndexes.length) {
        angular.forEach(trackIndexes, function(trackId, index) {
            if(typeof trackId === 'string') {
                TracksSvc.inflate(trackId, this, function(track) {}, 
                function(err) {});
            }
        }, $scope.queueTracks);
    }

    $scope.removeTrack = function(index) {
        QueueSvc.removeTrackAt(index, function(index) {
            $scope.queueTracks.splice(index, 1);
        }, function(err) {
            $log.error(err);
        });
    };
}]);