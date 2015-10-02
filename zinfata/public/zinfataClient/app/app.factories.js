app.factory('Users', function($resource) {
  return $resource('/api/users/:id', null, {
    'update': {method:'PUT'}
  });
})
.factory('Albums', function($resource) {
  return $resource('/api/albums/:id', null, {
    'update': {method:'PUT'}
  });
})
.factory('Playlists', function($resource) {
  return $resource('/api/playlists/:id', null, {
    'update': {method:'PUT'}
  });
})
.factory('Tracks', function($resource) {
  return $resource('/api/tracks/:id', null, {
    'update': {method:'PUT'}
  });
})
.factory('Auth', ['$http', '$rootScope', 'Session', 'MessageSvc', '$log', function($http, $rootScope, Session, MessageSvc, $log) {
  return {
    login: function(credentials, success, failure) {
      return $http.post('/login', credentials).then(function(res) {
        Session.create(res.data.id, res.data.role);
        return success(res.data);
      }, function(err) {
        $log.error('Unable to log user in: ' + angular.toJson(err));
        return failure(err);
      });
    },
    logout: function(success, failure) {
      return $http.get('/logout').then(function() {
        Session.destroy;
        return success();
      }, function(err) {
        $log.error('Unable to log user out: ' + angular.toJson(err));
        return failure(err);
      });
    },
    currentUser: function() {
      return $http.get('/currentuser');
    },
    isAuthenticated: function() {
      return !!Session.userId;
    },
    isAuthorized: function(authorizedRoles) {
      if(!angular.isArray(authorizedRoles)) {
        authorizedRoles = [authorizedRoles];
      }
      return (isAuthenticated && authorizedRoles.indexOf(Session.userRole) !== -1);
    }
  };
}]);
