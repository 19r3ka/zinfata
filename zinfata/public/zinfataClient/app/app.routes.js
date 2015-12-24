app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
  $routeProvider.
    when('/', {
      templateUrl: '/partials/dashboard',
      controller:  'dashboardCtrl'
    }).
    when('/register', {
      templateUrl: '/partials/registration',
      controller:  'registerCtrl'
    }).
    when('/login', {
      templateUrl: '/partials/login',
      controller:  'loginCtrl'
    }).
    when('/forgot', {
      templateUrl: '/partials/forgot',
      controller:  'forgotCtrl'
    }).
    when('/reset', {
      templateUrl: '/partials/passwordReset',
      controller:  'passwordResetCtrl'
    }).
    when('/user/:userId', {
      templateUrl: '/partials/userProfile',
      controller:  'userProfileCtrl',
      data: {
        memberOnly: true,
        authorizedRoles: ['all']
      }
    }).
    when('/album/new', {
      templateUrl: '/partials/album',
      controller:  'newAlbumCtrl'
    }).
    when('/album/:albumId', {
        templateUrl: '/partials/album',
        controller:  'albumCtrl'
    }).
    when('/album/:albumId/edit', {
        templateUrl: '/partials/album',
        controller:  'albumCtrl'
    }).
    when('/track/new', {
      templateUrl: '/partials/track',
      controller:  'trackCtrl'
    }).
    when('/track/:trackId', {
      templateUrl: '/partials/track',
      controller:  'trackCtrl'
    }).
    when('/track/:trackId/edit', {
      templateUrl: '/partials/track',
      controller:  'trackCtrl'
    }).
    when('/playlist/new', {
      templateUrl: '/partials/playlist',
      controller:  'playlistCtrl'
    }).
    when('/playlist/:playlistId', {
      templateUrl: '/partials/playlist',
      controller:  'playlistCtrl'
    }).
    when('/playlist/:playlistId/edit', {
      templateUrl: '/partials/playlist',
      controller:  'playlistCtrl'
    }).
    when('/queue', {
      templateUrl: '/partials/queue',
      controller:  'queueCtrl'
    }).
    otherwise({redirectTo: '/'});

  $locationProvider.html5Mode(true);
}]).
run(function(Auth, $log, UsersSvc, Session) {
  Auth.currentUser(function(user) {
    UsersSvc.setCurrentUser(user);
  });
});
