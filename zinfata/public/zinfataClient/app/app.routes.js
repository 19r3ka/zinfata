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
      controller:  'userProfileCtrl'
    }).
    when('/user/:userId/edit', {
      templateUrl: '/partials/userProfile',
      controller:  'userProfileCtrl',
      access: {
        loginRequired: true
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
      controller:  'albumCtrl',
      access: {
        loginRequired: true
      }
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
      controller:  'trackCtrl',
      access: {
        loginRequired: true
      }
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
      controller:  'playlistCtrl',
      access: {
        loginRequired: true
      }
    }).
    when('/queue', {
      templateUrl: '/partials/queue',
      controller:  'queueCtrl'
    }).
    otherwise({redirectTo: '/'});

  $locationProvider.html5Mode(true);
}]).
run(function($rootScope, $location, $log, Auth, AuthorizationSvc, AUTHORIZATION, UsersSvc, Session) {
  /*variable to capture user's final destination
    in case of redirection to the /login page
    on protected route requests. */
  var loginRedirectUrl;

  /*Auth is a homebrew factory
    that retrieves user data
    directly from the server.*/
  Auth.currentUser(function(user) {
    UsersSvc.setCurrentUser(user);
  });

  /*Listen to route changes 
    to intercept and inject behaviors. */  
  $rootScope.$on('$routeChangeStart', function(event, next) {
    var authorized;
    
    if(!!loginRedirectUrl && next.originalPath !== '/login') {
      $location.path(loginRedirectUrl).replace();
      loginRedirectUrl = '';
    } else if(!!next.access) {
      authorized = AuthorizationSvc.authorize(next.access.loginRequired);
      if(authorized === AUTHORIZATION.mustLogIn) {
        loginRedirectUrl = $location.url();
        $location.path('login'); 
      } else if(authorized === AUTHORIZATION.notAuthorized) {
        // $location.path(403page);
      }
    }
  });
});
