app.controller('queueCtrl', ['$scope', '$rootScope', '$log', 'QueueSvc', 'TracksSvc', 'UsersSvc', 'AlbumsSvc',
                            function($scope, $rootScope, $log, QueueSvc, TracksSvc, UsersSvc, AlbumsSvc) {
    $scope.queueTracks = [];
    var trackIndexes   = QueueSvc.getTracks();
        /* If there are tracks, be sure to inflate 
        ** each track with album and artist info.*/ 
    if(!!trackIndexes.length) {
        angular.forEach(trackIndexes, function(value, index) {
            var item;
            if(typeof value === 'string') {
                TracksSvc.get(value, function(track) {
                    UsersSvc.get(track.artist.id, function(user) {
                        track.artist.handle = user.handle;
                    }, function(err) {
                        $log.error('Error getting queue track artist info: ' + err);
                    });
                    AlbumsSvc.get(track.album.id, function(album) {
                        track.album.title  = album.title;
                    }, function(err) {
                        $log.error('Error getting queue track album info: ' + err);
                    });
                    $scope.queueTracks.push(track);   
                }, function(err) {});
            }
        });
    }

    $scope.removeTrack = function(index) {
        QueueSvc.removeTrackAt(index, function(index) {
            $scope.queueTracks.splice(index, 1);
        }, function(err) {
            $log.error(err);
        });
    };
}]);