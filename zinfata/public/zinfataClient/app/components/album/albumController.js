app.controller('albumCtrl', ['$scope', '$rootScope', '$location', '$routeParams', 'SessionSvc', 'AlbumsSvc', 'UsersSvc', 'MessageSvc', 'ALBUM_EVENTS', '$log',
                            function($scope, $rootScope, $location, $routeParams, Session, AlbumsSvc, User, MessageSvc, ALBUM_EVENTS, $log) {
	$scope.album = {
        coverArt:       'zinfataClient/assets/images/album-coverart-placeholder.png',
        imageUrl:       '',
        title:          '',
        artistId:       '',
        releaseDate:    ''
    };
	$scope.editing  = false;
    $scope.creating = false;
    $scope.canEdit  = false;


    switch($location.path()) {
        case '/album/new':
            $scope.creating = true;
            break;
        case '/album/' + $routeParams.albumId + '/edit':
            $scope.editing = true;
            break;
        default:
            $scope.editing = $scope.creating = false;
    }

    if($routeParams.albumId){
        AlbumsSvc.get($routeParams.albumId, function(data) {
    		$scope.album = data;
    		if(!!$scope.album.artistId && $scope.album.artistId === Session.getCurrentUser()._id) $scope.canEdit = true;
            User.get($scope.album.artistId, function(user) {
                $scope.album.artist = user.handle;
            }, function(err) {
                $scope.album.artist = 'Zinfata';
            })
    	}, function(err) {
    		$location.path('/');
    	});
    }

    $scope.edit = function(album) {
        $location.path('/album/' + album._id + '/edit');
    };

    $scope.readFile = function(elem) {
        var file    = elem.files[0];
        var reader  = new FileReader();
        reader.onload = function() {
            $scope.$apply(function() {
                $scope.album.coverArt = file;
                $scope.album.imageUrl = reader.result;
            })
        }
        reader.readAsDataURL(file);
    };

    $scope.create = function(album) {
        if(!album.artistId) album.artistId = Session.getCurrentUser()._id;
        AlbumsSvc.create(album, function(created_album) {
            $rootScope.$broadcast(ALBUM_EVENTS.createSuccess);
            MessageSvc.addMsg('success', 'You have successfully added a new album!');
            $location.path('album/' + created_album._id);
        }, function(err) {
            $rootScope.$broadcast(ALBUM_EVENTS.createFailed);
            MessageSvc.addMsg('danger', 'Something went wrong trying to create your album!');
        });
    };

    $scope.update = function(album) {
        if(!album.artistId) album.artistId = Session.getCurrentUser()._id;
        AlbumsSvc.update(album, function(updated_album) {
            $rootScope.$broadcast(ALBUM_EVENTS.updateSuccess);
            MessageSvc.addMsg('success', 'You have successfully updated the album info');
            $scope.editing = false;
            $location.path('album/' + updated_album._id);
        }, function(err) {
            $rootScope.$broadcast(ALBUM_EVENTS.updateFailed);
            MessageSvc.addMsg('danger', 'Something went wrong trying to update your album!');
        });
    };

    $scope.delete = function(album) {
        AlbumsSvc.delete(album, function() {
            MessageSvc.addMsg('success', 'The album has been successfully deleted!');
            $rootScope.$broadcast(ALBUM_EVENTS.deleteSuccess);
            $location.path('/user/' + album.artistId);
        }, function(err) {
            MessageSvc.addMsg('danger', 'A problem prevented the deletion of your album. Try again later');
            $rootScope.$broadcast(ALBUM_EVENTS.deleteFailed);
        });
    };
}]);