app.controller('userProfileCtrl', ['$scope', '$rootScope', 'UsersSvc', 'AlbumsSvc', 'MessageSvc', 
                                    'USER_EVENTS', '$routeParams', '$log', '$location', 'SessionSvc',
                                   function($scope, $rootScope, UsersSvc, AlbumsSvc, MessageSvc, 
                                    USER_EVENTS, $routeParams, $log, $location, Session) {
    // $scope.user = UsersSvc.get($routeParams.userId) || Session.getCurrentUser();
    var userId = $routeParams.userId || Session.getCurrentUser() && Sesion.getCurrentUser()._id || null
    if(!!!userId) $location.path('/');

    $scope.user     = {};
    $scope.editing  = false;
    UsersSvc.get(userId, function(user) {
        $scope.user = user;
    }, function(err) {
        $scope.user = Session.getCurrentUser();
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

    $scope.canEdit = function() {
        return Session.getCurrentUser()._id === $scope.user._id;
    };

    $scope.edit    = function() {
        $scope.editing = true;
    };

    $scope.update = function() {
        UsersSvc.update($scope.user, function(updatedUser) {
          MessageSvc.addMsg('success', 'Your profile has been updated!');
          $rootScope.$broadcast(USER_EVENTS.updateSuccess);
          $scope.editing = false;
        }, function(err) {
          MessageSvc.addMsg('danger', 'Profile update unsuccessful!');
          $rootScope.$broadcast(USER_EVENTS.updateFailed);
        });
    };

	$scope.delete = function() {
		UsersSvc.delete($scope.user, function() {
			MessageSvc.addMsg('success', 'Your account has been deleted!');
			$rootScope.$broadcast(USER_EVENTS.deleteSuccess);
			$location.path = '/';
		}, function(err) {
			MessageSvc.addMsg('danger', 'A problem prevented your account deletion. Try again later');
			$rootScope.$broadcast(USER_EVENTS.deleteFailed);
		});
	};

    $scope.readFile = function(elem) {
        var file = elem.files[0];
		var reader = new FileReader();
		reader.onload = function() {
			$scope.$apply(function() {
                $scope.user.avatar = file;
                $scope.user.avatarUrl = reader.result;
                $scope.editing = true;
			});
		};
		reader.readAsDataURL(file);
    };
}]);