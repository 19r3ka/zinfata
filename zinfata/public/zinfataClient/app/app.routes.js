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
    when('/user/:userId', {
      templateUrl: '/partials/userProfile',
      controller:  'userProfileCtrl',
      data: {
        memberOnly: true,
        authorizedRoles: ['all']
      }
    }).
    otherwise({redirectTo: '/'});

  $locationProvider.html5Mode(true);
}]).
run(function(Auth, $log, UsersSvc, Session) {
  Auth.currentUser(function(user) {
    UsersSvc.setCurrentUser(user);
  });
});
