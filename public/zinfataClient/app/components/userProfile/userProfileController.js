app.controller('userProfileCtrl', ['$scope', '$rootScope', 'UsersSvc',
'AlbumsSvc', 'MessageSvc', 'USER_EVENTS', '$routeParams', '$log', '$location',
'SessionSvc', function($scope, $rootScope, UsersSvc, AlbumsSvc, MessageSvc,
USER_EVENTS, $routeParams, $log, $location, Session) {
  var userId = $routeParams.userId ||
    Session.getCurrentUser() && Sesion.getCurrentUser()._id ||
    null;

  $scope.fbRegex = /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:(?:\w)*#!\/)?(?:pages\/)?(?:[\w\-]*\/)*([\w\-]*)/;

  $scope.user         = {};
  $scope.editing      = false;
  $scope.canEdit      = false;

  UsersSvc.get(userId, function(user) {
    $scope.user = user;
    if (Session.getCurrentUser()._id === $scope.user._id) {
      $scope.canEdit = true;
    }
    if (($location.path() === '/user/' + userId + '/edit') && $scope.canEdit) {
      $scope.editing = true;
    }
  }, function(err) {
    $location.path('/');
  });

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
    UsersSvc.delete(user, function(deletedUser) {
      MessageSvc.addMsg('success', 'Your account has been deleted!');
      $rootScope.$broadcast(USER_EVENTS.deleteSuccess, deletedUser);
    }, function(err) {
      MessageSvc.addMsg('danger',
        'A problem prevented your account deletion. Try again later');
      $rootScope.$broadcast(USER_EVENTS.deleteFailed);
    });
  };

  $scope.updateAvatar = function(image) {
    $scope.user.avatar    = image.file;
    $scope.user.avatarUrl = image.url;
  };
}]);
