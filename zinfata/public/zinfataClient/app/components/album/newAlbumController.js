app.controller('newAlbumCtrl', ['$scope', '$rootScope', 'SessionSvc', 'AlbumsSvc', 'MessageSvc', 'ALBUM_EVENTS', '$location',
							function($scope, $rootScope, Session, AlbumsSvc, MessageSvc, ALBUM_EVENTS, $location) {
	$scope.album = {
		coverArt: 		'',
		imageUrl:		'',
		title:			'',
		artistId:		'',
		releaseDate: 	''
	};
    $scope.creating = true;
    $scope.canEdit  = false;
    $scope.editing   = false;
	$scope.album.artistId = Session.getCurrentUser()._id;
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
	}
	$scope.create = function(album) {
		AlbumsSvc.create(album, function(created_album) {
			$rootScope.$broadcast(ALBUM_EVENTS.createSuccess);
			MessageSvc.addMsg('success', 'You have successfully added a new album!');
			$location.path('album/' + created_album._id);
		}, function(err) {
			$rootScope.$broadcast(ALBUM_EVENTS.createFailed);
			MessageSvc.addMsg('danger', 'Something went wrong trying to create your album!');
		});
	};
}]);