app.config(['$routeProvider', '$locationProvider', '$httpProvider',
            function($routeProvider, $locationProvider, $httpProvider) {
  $routeProvider.
    when('/', {
      templateUrl: '/partials/dashboard',
      controller:  'dashboardCtrl'
    }).
    when('/register', {
      templateUrl: '/partials/registration',
      controller:  'registerCtrl'
    }).
    when('/register/activate', {
      templateUrl:   '/partials/tokenValidator',
      controller: 'tokenCtrl'
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
      access: {
        loginRequired: true
      }
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
      controller:  'albumCtrl',
      access: {
        loginRequired: true
      }
    }).
    when('/album/:albumId', {
      templateUrl: '/partials/album',
      controller:  'albumCtrl',
      access: {
        loginRequired: true
      }
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
      controller:  'trackCtrl',
      access: {
        loginRequired: true
      }
    }).
    when('/track/:trackId', {
      templateUrl: '/partials/track',
      controller:  'trackCtrl',
      access: {
        loginRequired: true
      }
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
      controller:  'playlistCtrl',
      access: {
        loginRequired: true
      }
    }).
    when('/playlist/:playlistId', {
      templateUrl: '/partials/playlist',
      controller:  'playlistCtrl',
      access: {
        loginRequired: true
      }
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
      controller:  'queueCtrl',
      access: {
        loginRequired: true
      }
    }).
    when('/search', {
      templateUrl: '/partials/search',
      controller:  'searchCtrl',
      access: {
        loginRequired: true
      }
    }).
    otherwise({redirectTo: '/'});

  $locationProvider.html5Mode(true);
  $httpProvider.interceptors.push('APIInterceptor');
}])
.run(function($rootScope, $location, $log, AuthenticationSvc, AUTH, MessageSvc, UsersSvc) {
  /*variable to capture user's final destination
    in case of redirection to the /login page
    on protected route requests. */
  var loginRedirectUrl;

  /*Listen to route changes
    to intercept and inject behaviors. */
  $rootScope.$on('$routeChangeStart', function(event, next) {
    var authorized;

    if (next.originalPath === '/register') {
      loginRedirectUrl = null;
    } else if (!!loginRedirectUrl && next.originalPath !== '/login') {
      $location.path(loginRedirectUrl).replace();
      loginRedirectUrl = null;
    }

    if (!!next.access) {
      authorized = AuthenticationSvc.authorize(next.access.loginRequired);

      if (authorized === AUTH.mustLogIn) {
        loginRedirectUrl = $location.url();
        MessageSvc.addMsg(
          'warning',
          'You must log-in first to access that resource.'
        );
        $rootScope.$broadcast(AUTH.notAuthenticated);
        $location.path('login');
      } else if (authorized === AUTH.notAuthorized) {
        // $location.path(403page);
      }
    }
  });
});
