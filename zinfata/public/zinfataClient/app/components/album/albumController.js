app.controller('albumCtrl', ['$scope', '$rootScope', '$location', '$routeParams', 'SessionSvc', 'AlbumsSvc', 'MessageSvc', 'ALBUM_EVENTS', '$log',
                                        function($scope, $rootScope, $location, $routeParams, Session, AlbumsSvc, MessageSvc, ALBUM_EVENTS, $log) {
		$scope.album = {};
		$scope.editing   = false;
        $scope.creating = false;
        $scope.canEdit  = false;

        AlbumsSvc.get($routeParams.albumId, function(data) {
			$scope.album = data;
			$scope.album.tracks = [];
			if(!!$scope.album.artistId && $scope.album.artistId === Session.getCurrentUser()._id) {
				$scope.canEdit = true;
			}
		}, function(err) {
			$location.path('/');
		});

        $scope.edit = function() {
            $scope.editing = true;
        };

        $scope.readFile = function(elem) {
            var file = elem.files[0];
            var reader = new FileReader();
            reader.onload = function() {
                $scope.$apply(function() {
                    $scope.album.coverArt = file;
                    $scope.album.imageUrl = reader.result;
                })
            }
            reader.readAsDataURL(file);
        };
        $scope.update = function(album) {
            AlbumsSvc.update(album, function(updated_album) {
                $rootScope.$broadcast(ALBUM_EVENTS.updateSuccess);
                MessageSvc.addMsg('success', 'You have successfully updated the album info');
                $scope.editing = false;
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