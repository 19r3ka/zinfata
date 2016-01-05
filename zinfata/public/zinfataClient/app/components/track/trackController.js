app.controller('trackCtrl', ['$scope', '$sce', '$rootScope', '$location', '$routeParams', '$log', 'UsersSvc', 
                            'TracksSvc', 'PlaylistsSvc', 'TRACK_EVENTS', 'AlbumsSvc', 'MessageSvc', 'QueueSvc',
							function($scope, $sce, $rootScope, $location, $routeParams, $log, UsersSvc,
                            TracksSvc, PlaylistsSvc, TRACK_EVENTS, AlbumsSvc, MessageSvc, QueueSvc) {
	var userAddedFile = '',
        coverArts     = {};

    $scope.track 	  = {
        title:       '',
        album:  {
            id:      '',
            title:   ''
        },
        artist: {
            id:      '',
            handle:  ''
        },
        streamUrl:   '',
        coverArt:    '',
        releaseDate: ''
    };
    /* This is a temporary fix playlist listing get its own directive
    ** with its own controller and factory. */
    PlaylistsSvc.find({a_id: UsersSvc.getCurrentUser()._id}, function(data) {
        $scope.playlists = data;
    }, function(err) {});

	$scope.albums 	   = {};
	$scope.editing     = false;
	$scope.creating    = false;
    $scope.uniqueCover = false;

    if($location.path() === '/track/new') $scope.creating = true;
    if(($location.path() === '/track/' + $routeParams.trackId + '/edit') && $scope.canEdit) $scope.editing = true;

    if(!$scope.creating && !!$routeParams.trackId) {
        TracksSvc.get($routeParams.trackId, function(data) {
            $scope.track            = data;
            $scope.track.streamUrl  = $sce.trustAsResourceUrl(data.streamUrl);
            
            /*
            ** Get the albums pertaining to the track's artist
            ** And update all information relative to current track's album
            */
            AlbumsSvc.getByUser({ _id: $scope.track.artist.id }, function(data) {
                $scope.albums = data;
                for(var i = 0; i < $scope.albums.length; i++) {
                    coverArts[$scope.albums[i]._id] = $scope.albums[i].imageUrl;
                    if($scope.albums[i]._id === $scope.track.album.id) {
                        $scope.track.album.title = $scope.albums[i].title;
                        if($scope.track.coverArt !== $scope.albums[i].coverArt) $scope.uniqueCover = true;
                    }
                } 
            }, function(err) {
                $log.error('Error fetching albums for artist: ' + $scope.track.artist.id );
            });
            UsersSvc.get($scope.track.artist.id, function(artist) {
                $scope.track.artist.handle = artist.handle;
            }, function(err) {
                $log.error('could not fetch track artist: ' + $scope.track.artist.id );
            });
        }, function(err) {
            $location.path('/');
        });
    }
    /* 
    ** Populate $scope.albums with the current user's albums
    ** when available only when adding a new track.
    ** Otherwise use get the albums by track's artist id
    */
    if(!!$scope.creating) {
        AlbumsSvc.getByUser(UsersSvc.getCurrentUser(), function(data) {
            $scope.albums             = data;
            $scope.track.album.id     = $scope.albums[0]._id;
            $scope.track.releaseDate  = new Date($scope.albums[0].releaseDate);
            for(var i = 0; i < $scope.albums.length; i++) {
                coverArts[$scope.albums[i]._id] = $scope.albums[i].imageUrl;
            } 
        });
    }
    /* 
    ** Watch $scope.track.album.id to
    ** update the coverArt dynamically
    ** whenever the album selected changes
    */
    $scope.$watch(function() { return $scope.track.album.id; }, function(newValue, oldValue) {
        if((newValue !== oldValue) && !$scope.uniqueCover) {
            $scope.track.coverArt.url = coverArts[newValue];
        }
    });
    
    $scope.canEdit = function() {
        if(!!$scope.track.artist.id && ($scope.track.artist.id === UsersSvc.getCurrentUser()._id)) return true;
        return false;
    }

	$scope.readFile = function(elem) {
        var file    = elem.files[0];
        var reader  = new FileReader();
        reader.onload = function() {
            $scope.$apply(function() {
                if(elem.name='avatar') {
                    $scope.track.imageFile  = file;
                    $scope.track.coverArt   = userAddedFile = reader.result;
                }
            // Reading large mp3 files causes the browser to crash.    
            /*    if(elem.name='music') {
                    $scope.track.file = file;
                    $scope.track.streamUrl  = $sce.trustAsResourceUrl(reader.result);
                } */
            })
        }
        reader.readAsDataURL(file);
    };

    /* This function is a workaround for readFile()
    ** to upload files that are too big to read
    */
    $scope.getFile = function(elem) {
        $scope.track.audioFile = elem.files[0];
    };

    $scope.addToPlaylist = function(playlist) {
        PlaylistsSvc.addTrack(playlist, $scope.track)
    };

    $scope.play = function(track) {
        QueueSvc.playNow(track);
    };

    $scope.addToQueue = function(track) {
        QueueSvc.addTrack(track);
    };

    $scope.create = function(track) {
        TracksSvc.create(track, function(created_track) {
            $rootScope.$broadcast(TRACK_EVENTS.createSuccess);
            MessageSvc.addMsg('success', 'You have successfully added a new track!');
            $location.path('track/' + created_track._id);
        }, function(err) {
            $rootScope.$broadcast(TRACK_EVENTS.createFailed);
            MessageSvc.addMsg('danger', 'Something went wrong trying to upload your new track!');
        });
    };

	$scope.update = function(track) {
        TracksSvc.update(track, function(updated_track) {
            $rootScope.$broadcast(TRACK_EVENTS.updateSuccess);
            MessageSvc.addMsg('success', 'You have successfully updated this track!');
        }, function(err) {
            $rootScope.$broadcast(TRACK_EVENTS.updateFailed);
            MessageSvc.addMsg('danger', 'Something went wrong trying to update your track\'s info!');
        });
	};

    $scope.delete = function(track) {
        TracksSvc.delete(track, function(deleted_track) {
            $rootScope.$broadcast(TRACK_EVENTS.deleteSuccess);
            MessageSvc.addMsg('success', 'You have successfully deleted the track!');
            $location.path('/album/' + deleted_track.album.id);
        }, function(err) {
            $rootScope.$broadcast(TRACK_EVENTS.deleteFailed);
            MessageSvc.addMsg('danger', 'Something went wrong trying to delete your track!');
        });
    };

    $scope.updateCoverArt = function() {
        if(!$scope.uniqueCover) {
            $scope.track.coverArt.url = coverArts[$scope.track.album.id];
        } else {
            $scope.track.coverArt.url = userAddedFile;
        }
    }

    $scope.edit = function() {
        $location.path('/track/' + $scope.track._id + '/edit');
    };
}]);