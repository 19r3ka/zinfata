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
    login: function(credentials) {
      return $http.post('/login', credentials).then(function(res) {
        Session.create(res.data.id, res.data.role);
        return res.data;
      }, function(err) {
        $log.error('Unable to log user in: ' + err);
        return false;
      });
    },
    logout: function() {
      return $http.get('/logout').then(function() {
        Session.destroy;
        MessageSvc.addMsg('success', 'You have been successfully logged out!');
      }, function() {
        MessageSvc.addMsg('danger', 'We couldn\'t log you out. Try again later!');
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
