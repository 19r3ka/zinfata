app.controller('userProfileCtrl', ['$scope', '$rootScope', 'UsersSvc', 'AlbumsSvc', 'MessageSvc', 
                                    'USER_EVENTS', '$routeParams', '$log', '$location', 'SessionSvc',
                                   function($scope, $rootScope, UsersSvc, AlbumsSvc, MessageSvc, 
                                    USER_EVENTS, $routeParams, $log, $location, Session) {
    // $scope.user = UsersSvc.get($routeParams.userId) || Session.getCurrentUser();
    var userId = $routeParams.userId || Session.getCurrentUser() && Sesion.getCurrentUser()._id || null;
    /**
    * Converts data uri to Blob. Necessary for uploading.
    * @see http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
    * @param  {String} dataURI
    * @return {Blob}
   */
        /*dataURItoBlob = function(dataURI) {
    var binary = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    var array = [];
    for(var i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], {type: mimeString});
  };*/


    $scope.user         = {};
    /*$scope.rawImage     = '';
    $scope.croppedImage = '';
    $scope.cropPending  = false;*/
    $scope.editing      = false;
    $scope.canEdit      = false;

    UsersSvc.get(userId, function(user) {
        $scope.user = user;
        if(Session.getCurrentUser()._id === $scope.user._id) $scope.canEdit = true;
        if(($location.path() === '/user/' + userId + '/edit') && $scope.canEdit) $scope.editing = true;
    }, function(err) {
        $location.path('/');
    });
    
    // if(!!!Object.keys($scope.user).length) $location.path('/');
    
    /*if(!!$scope.user) $scope.user.albums = {};
    $scope.noAlbum = false;
    
    AlbumsSvc.getByUser({_id: $routeParams.userId}, function(data) {
		$scope.user.albums = data;
		if(!!!$scope.user.albums.length) $scope.noAlbum = true;
    }, function(err) {
		$scope.user.albums = {};
    });*/
    
    $scope.fullname = function(user) {
        return user.firstName + ' ' + user.lastName;
    };

   /* $scope.canEdit = function() {
        return Session.getCurrentUser()._id === $scope.user._id;
    };*/

    $scope.edit    = function() {
        $location.path('/user/' + $scope.user._id + '/edit');
    };

    $scope.update = function(user) {
        UsersSvc.update(user, function(updatedUser) {
          MessageSvc.addMsg('success', 'Your profile has been updated!');
          $rootScope.$broadcast(USER_EVENTS.updateSuccess);
          $scope.editing = false;
          $location.path('/user/' + $scope.user._id);
        }, function(err) {
          MessageSvc.addMsg('danger', 'Profile update unsuccessful!');
          $rootScope.$broadcast(USER_EVENTS.updateFailed);
        });
    };

	$scope.delete = function(user) {
		UsersSvc.delete(user, function() {
			MessageSvc.addMsg('success', 'Your account has been deleted!');
			$rootScope.$broadcast(USER_EVENTS.deleteSuccess);
			$location.path = '/';
		}, function(err) {
			MessageSvc.addMsg('danger', 'A problem prevented your account deletion. Try again later');
			$rootScope.$broadcast(USER_EVENTS.deleteFailed);
		});
	};

    /*$scope.readFile = function(elem) {
        var file = elem.files[0];
		var reader = new FileReader();
		reader.onload = function() {
			$scope.$apply(function() {
                $scope.user.avatar = file;
                $scope.rawImage    = reader.result;
                $scope.cropPending = true;
                $scope.editing     = true;
			});
		};
		reader.readAsDataURL(file);
    };*/

    $scope.updateAvatar = function(image) {
        /*$scope.user.avatar    = dataURItoBlob(image);
        $scope.user.avatarUrl = image;
        $scope.cropPending    = false;*/
        $scope.user.avatar    = image.file;
        $scope.user.avatarUrl = image.url;
    }
}]);