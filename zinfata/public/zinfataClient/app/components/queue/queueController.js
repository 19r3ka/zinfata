app.controller('queueCtrl', ['$scope', '$rootScope', '$log', 'QueueSvc', 'TracksSvc', 'UsersSvc', 'AlbumsSvc', 'AUDIO',
                            function($scope, $rootScope, $log, QueueSvc, TracksSvc, UsersSvc, AlbumsSvc, AUDIO) {
    $scope.queueTracks   = [];
    $scope.nowLoaded     = QueueSvc.getCurrentTrack() && QueueSvc.getCurrentTrack().index;
    $scope.queueDuration = 0;
    var trackIndexes     = QueueSvc.getTracks();

    /* If there are tracks, be sure to inflate 
    ** each track with album and artist info.*/ 
    if(!!trackIndexes.length) {
        var duration = 0;
        angular.forEach(trackIndexes, function(trackId, index) {
            if(typeof trackId === 'string') {
                TracksSvc.inflate(trackId, this, function(track) {
                    duration = parseInt(track.duration);
                    if(!angular.isNumber(duration)) duration = 0;
                    $scope.queueDuration += duration;
                }, 
                function(err) {});
            }
        }, $scope.queueTracks);
    }

    $scope.$on(AUDIO.set, function() {
        $scope.nowLoaded = QueueSvc.getCurrentTrack() && QueueSvc.getCurrentTrack().index;  
    });

    $scope.playPause   = function(event, index) {
        event.preventDefault();

        if($scope.nowLoaded === index) {
            $rootScope.$broadcast(AUDIO.playPause);
        } else {
            QueueSvc.play($scope.queueTracks[index], index);
            $scope.nowLoaded = index;
        }
    };

    $scope.removeTrack = function(index) {
        QueueSvc.removeTrackAt(index, function(index) {
            $scope.queueTracks.splice(index, 1);
            $rootScope.$broadcast(AUDIO.set);
        }, function(err) {
            $log.error(err);
        });
    };
}]);
