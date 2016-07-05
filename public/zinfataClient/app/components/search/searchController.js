app.controller('searchCtrl', ['$routeParams', function(params) {
  if('q' in params) {
    scope.searchTerm = params.q; 
  }
}]);