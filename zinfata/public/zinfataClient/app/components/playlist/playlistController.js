app.controller('playlistCtrl', ['$scope', '$rootScope', '$location', '$log', '$routeParams', 'AlbumsSvc', 
                                'TracksSvc', 'UsersSvc', 'PlaylistsSvc', 'MessageSvc', 'QueueSvc' ,'PLAYLIST_EVENTS',  
                              function($scope, $rootScope, $location, $log, $routeParams, AlbumsSvc, TracksSvc, 
                                UsersSvc, PlaylistsSvc, MessageSvc, QueueSvc, PLAYLIST_EVENTS) {
    $scope.playlist = {
        title:      '',
        owner:   {
            id:     '',
            handle: ''
        },
        tracks:  []
    }
    $scope.playlistTracks = []; // array of inflated track metadata objects
    $scope.creating = false;
    $scope.editing  = false;

    if($location.path() === '/playlist/new') $scope.creating = true;
    if($location.path() === '/playlist/' + $routeParams.playlistId + '/edit' && $scope.canEdit) $scope.editing = true; 
    if(!$scope.creating && !!$routeParams.playlistId) {
        PlaylistsSvc.get($routeParams.playlistId, function(data) {
            UsersSvc.get(data.owner.id, function(owner){
                data.owner.handle = owner.handle;
            }, function(err) {
                $log.error('Error getting playlist owner info: ' + err);
            });
            /* If there are tracks, be sure to inflate 
            ** each track with album and artist info. */
            if(!!data.tracks.length) {
                angular.forEach(data.tracks, function(value, index) {
                    if(typeof value === 'string') {
                        TracksSvc.get(value, function(track) {
                            UsersSvc.get(track.artist.id, function(user) {
                                track.artist.handle = user.handle;
                            }, function(err) {
                                $log.error('Error getting playlist track artist info: ' + err);
                            });
                            AlbumsSvc.get(track.album.id, function(album) {
                                track.album.title  = album.title;
                            }, function(err) {
                                $log.error('Error getting playlist track album info: ' + err);
                            });
                            $scope.playlistTracks.push(track);
                        }, function(err) {});
                    }
                })
            }
            // Only assign the metadata to the scope playlist at the very end!
            $scope.playlist = data;
            $scope.playlistTracks = data.tracks; 
        }, function(err) {
            $location.path('/');
        });
    }

    $scope.canEdit = function() {
        if(!!$scope.playlist.owner.id && ($scope.playlist.owner.id === UsersSvc.getCurrentUser()._id)) return true;
        return false;
    };

    $scope.edit = function() {
        $location.path('/playlist/' + $scope.playlist._id + '/edit');
    };   

    $scope.removeTrack = function(index) {
        $scope.playlistTracks.splice(index, 1);
        // PlaylistsSvc.removeTrack($scope.playlist, index)
    };

    $scope.play = function(track) {
        QueueSvc.playNow(track);
    };

    $scope.addToQueue = function(track) {
        QueueSvc.addTrack(track);
    };

    $scope.create = function(playlist) {
        if(!!!playlist.owner.id) playlist.owner.id = UsersSvc.getCurrentUser()._id
        PlaylistsSvc.create(playlist, function(created_playlist) {
            $rootScope.$broadcast(PLAYLIST_EVENTS.createSuccess);
            MessageSvc.addMsg('success', 'You have successfully added a new playlist!');
            $location.path('playlist/' + created_playlist._id);
        }, function(err) {
            $rootScope.$broadcast(PLAYLIST_EVENTS.createFailed);
            MessageSvc.addMsg('danger', 'Something went wrong trying to upload your new playlist!');
        });
    };

    $scope.update = function(playlist) {
        PlaylistsSvc.update(playlist, function(updated_playlist) {
            $rootScope.$broadcast(PLAYLIST_EVENTS.updateSuccess);
            MessageSvc.addMsg('success', 'You have successfully updated this playlist!');
        }, function(err) {
            $rootScope.$broadcast(PLAYLIST_EVENTS.updateFailed);
            MessageSvc.addMsg('danger', 'Something went wrong trying to update your playlist!');
        });
    };

    $scope.delete = function(playlist) {
        PlaylistsSvc.delete(playlist, function(deleted_playlist) {
            $rootScope.$broadcast(PLAYLIST_EVENTS.deleteSuccess);
            MessageSvc.addMsg('success', 'You have successfully deleted the playlist!');
            $location.path('/');
        }, function(err) {
            $rootScope.$broadcast(PLAYLIST_EVENTS.deleteFailed);
            MessageSvc.addMsg('danger', 'Something went wrong trying to delete your playlist!');
        });
    }
}]);