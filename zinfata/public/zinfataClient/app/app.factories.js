app.factory('Users', function($resource) {
  return $resource('/api/users/:id', null, {
    'update': {method:'PUT'}
  });
});
app.factory('Albums', function($resource) {
  return $resource('/api/albums/:id', null, {
    'update': {method:'PUT'}
  });
});
app.factory('Playlists', function($resource) {
  return $resource('/api/playlists/:id', null, {
    'update': {method:'PUT'}
  });
});
app.factory('Tracks', function($resource) {
  return $resource('/api/tracks/:id', null, {
    'update': {method:'PUT'}
  });
});
app.factory('Auth', function($http) {
  return {
    login: function(user) {
      return $http.post('/login', user);
    },
    logout: function() {
      return $http.get('/logout');
    },
    currentUser: function() {
      return $http.get('/currentuser');
    }
  };
});
