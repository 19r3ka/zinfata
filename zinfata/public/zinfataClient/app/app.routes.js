app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
  $routeProvider.
    when('/', {
      templateUrl: '/partials/dashboard',
      controller: 'dashboardCtrl'
    }).
    otherwise({redirectTo: '/'});

  $locationProvider.html5Mode(true);
}]);
