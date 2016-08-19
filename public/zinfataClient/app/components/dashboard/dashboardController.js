app.controller('dashboardCtrl', ['$scope', 'TracksSvc', 'SessionSvc', '$log',
'QueueSvc', '$window', 'InvitationsSvc',
function($scope, Tracks, Session, $log, Queue, $window, Invitations) {

  $scope.tracks = [];
  $scope.loggedIn = function loggedIn() {
    return !!Session.getCurrentUser();
  };

  Tracks.latest(function(tracks) {
    var latest = [];
    var id     = 0;
    angular.forEach(tracks, function(track) {
      track.id = id++;
      track.img = '/assets/tracks/' + track._id + '/tof';
      track.url = '/assets/tracks/' + track._id + '/zik';
      latest.push(track);
    });
    $scope.tracks = latest;
  }, function(err) {
    $log.error(err);
  });

  $scope.play = function play(track) {
    Queue.playNow(track);
  };

  $scope.addToQueue = function addToQueue(track) {
    Queue.addTrack(track);
  };

  /* Ultimately move this out to the .run function
     to capture verify on route change start instead */
  Invitations.verifyCookie(function(invitation) {
    // Do nothing when the cookie checks out
  }, function(err) {
    // Regardless of code status,
    // $window.location.href = '/coming_soon';
  });
}]);
