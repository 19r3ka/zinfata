app.controller('trackCtrl', ['$scope', '$sce', '$rootScope', '$location', '$routeParams', '$log', 'UsersSvc', 
                            'SessionSvc', 'TracksSvc', 'PlaylistsSvc', 'TRACK_EVENTS', 'AlbumsSvc', 'MessageSvc', 
                            'QueueSvc', function($scope, $sce, $rootScope, $location, $routeParams, $log, 
                            UsersSvc, Session, TracksSvc, PlaylistsSvc, TRACK_EVENTS, AlbumsSvc, MessageSvc, 
                            QueueSvc) {
	var userAddedFile  = '',
        coverArts      = {},
        releaseDates   = {};

    $scope.musicGenres = ['alternative', 'blues', 'danse', 'hip hop', 'rap', 'r&b', 'soul', 'jazz', 'gospel', 
                          'reggae', 'rock', 'dubstep', 'trap', 'instrumental', 'salsa', 'flamenco', 'reggaeton', 
                          'meditation', 'funk', 'dancehall', 'a cappella', 'afro-beat', 'calypso', 'coupe-decale', 
                          'worldbeat'];

    $scope.track 	   = {
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
        duration:    '',
        releaseDate: '',
        genre:       '',
        downloadable: false
    };
    $scope.cover = {
        unique:    false
    };
    
    if($location.path() === '/track/new') $scope.creating = true;

    if($routeParams.trackId) {
        TracksSvc.get($routeParams.trackId, function(data) {
            $scope.track            = data;
            $log.debug(data.genre);
            $scope.track.streamUrl  = $sce.trustAsResourceUrl(data.streamUrl);

            if(!!$scope.track.artist.id && ($scope.track.artist.id === Session.getCurrentUser()._id)) {
                $scope.canEdit = true;
            }

            if($location.path() === '/track/' + $routeParams.trackId + '/edit') {
                $scope.canEdit ? $scope.editing = true : $location.path('track/' + $routeParams.trackId);
            }

            /*
            ** Get the albums pertaining to the track's artist
            ** And update all information relative to current track's album
            */
            AlbumsSvc.getByUser({ _id: $scope.track.artist.id }, function(data) {
                $scope.albums = data;
                angular.forEach($scope.albums, function(album) {
                    this[album._id]         = album.imageUrl;
                    releaseDates[album._id] = album.releaseDate;
                    if(album._id === $scope.track.album.id) {
                        $scope.track.album.title       = album.title;
                        $scope.track.album.releaseDate = album.releaseDate;
                        if($scope.track.coverArt !== album.imageUrl) {
                            $scope.cover.unique = true;
                            /* Save the original unique cover art in case we need to revert back to it
                               when the user unchecks 'cover.unique' without uploading new cover afterwards
                            */
                            userAddedFile      = $scope.track.coverArt;
                        }
                    }
                }, coverArts);
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
    if($scope.creating) {
        AlbumsSvc.getByUser(Session.getCurrentUser(), function(data) {
            $scope.albums             = data;
            $scope.track.album.id     = $scope.albums[0]._id;
            $scope.track.releaseDate  = new Date($scope.albums[0].releaseDate);
            for(var i = 0; i < $scope.albums.length; i++) {
                coverArts[$scope.albums[i]._id]    = $scope.albums[i].imageUrl;
                releaseDates[$scope.albums[i]._id] = $scope.albums[i].releaseDate;
            } 
        });
    }
    /* 
    ** Watch $scope.track.album.id to update the coverArt dynamically whenever the album selected changes
    */
    $scope.$watch(function() { return $scope.track.album.id; }, function(newValue, oldValue) {
        if(newValue !== oldValue) {
            $log.debug($scope.cover.unique);
            if(!$scope.cover.unique && !!coverArts[newValue]) $scope.track.coverArt = coverArts[newValue];
            $scope.track.album.releaseDate = releaseDates[newValue];
            if($scope.track.album.releaseDate < $scope.track.releaseDate) $scope.track.releaseDate = $scope.track.album.releaseDate;
        }
    });

    $scope.$watch(function() { return $scope.track.streamUrl; }, function(newValue, oldValue) {
        if(newValue !== oldValue) {
            var audio = new Audio(newValue);
            audio.onloadedmetadata = function() {
                $scope.track.duration = audio.duration;
            };
        }
    });

	$scope.readFile = function(elem) {
        var file    = elem.files[0];
        var reader  = new FileReader();
        reader.onload = function() {
            $scope.$apply(function() {
                /*if(elem.name === 'avatar') {
                    $scope.track.imageFile  = file;
                    $scope.track.coverArt   = userAddedFile = reader.result;
                }*/
            // Reading large mp3 files causes the browser to crash.    
                if(elem.name === 'music') {
                    $scope.track.audioFile  = file;
                    $scope.track.streamUrl  = $sce.trustAsResourceUrl(reader.result);
                } 
            });
        };
        reader.readAsDataURL(file);
    };

    /* This function is a workaround for readFile()
    ** to upload files that are too big to read
    */
    $scope.getFile = function(elem) {
        $scope.track.audioFile = elem.files[0];
    };

    $scope.addToPlaylist = function(playlist) {
        PlaylistsSvc.addTrack(playlist, $scope.track);
    };

    $scope.play = function(track) {
        QueueSvc.playNow(track);
    };

    $scope.addToQueue = function(track) {
        QueueSvc.addTrack(track);
    };

    $scope.create = function(track) {
        track.artist.id = Session.getCurrentUser()._id;
        delete track.streamUrl;
        TracksSvc.create(track, function(createdTrack) {
            $rootScope.$broadcast(TRACK_EVENTS.createSuccess, createdTrack);
            MessageSvc.addMsg('success', 'You have successfully added a new track!');
            $location.path('track/' + createdTrack._id);
        }, function(err) {
            $rootScope.$broadcast(TRACK_EVENTS.createFailed, err);
            MessageSvc.addMsg('danger', 'Something went wrong trying to upload your new track!');
        });
    };

	$scope.update = function(track) {
        delete track.streamUrl;
        TracksSvc.update(track, function(updatedTrack) {
            $rootScope.$broadcast(TRACK_EVENTS.updateSuccess, updatedTrack);
            MessageSvc.addMsg('success', 'You have successfully updated this track!');
            $location.path('track/' + updatedTrack._id);
        }, function(err) {
            $rootScope.$broadcast(TRACK_EVENTS.updateFailed, err);
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

    $scope.updateCoverArt = function(unique) {
        $log.debug(unique);
        if(!unique) {
            $scope.track.coverArt = coverArts[$scope.track.album.id];
        } else {
            $scope.track.coverArt = userAddedFile;
        }
        $log.debug($scope.track.coverArt);
    };

    $scope.updateCoverImage = function(image) {
        $scope.track.imageFile = image.file;
        $scope.track.coverArt  = userAddedFile = image.url;
    };

    $scope.download = function(track) {
        TracksSvc.downloadLink(track, function(downloadUrl) {
            $rootScope.$broadcast(TRACK_EVENTS.downloadSuccess);
        }, function() {
            $rootScope.$broadcast(TRACK_EVENTS.downloadFailed);
            MessageSvc.addMsg('danger', 'Download failed!');
        });
    };

    $scope.edit = function() {
        $location.path('/track/' + $scope.track._id + '/edit');
    };
}]);