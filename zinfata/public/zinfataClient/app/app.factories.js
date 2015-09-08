app.factory('Users', function($resource) {
  return $resource('/users/:id', null, {
    'update': {method:'PUT'}
  });
});
app.factory('Albums', function($resource) {
  return $resource('/albums/:id', null, {
    'update': {method:'PUT'}
  });
});
app.factory('Playlists', function($resource) {
  return $resource('/playlists/:id', null, {
    'update': {method:'PUT'}
  });
});
app.factory('Tracks', function($resource) {
  return $resource('/tracks/:id', null, {
    'update': {method:'PUT'}
  });
});
app.factory('Login', function($resource) {
  return $resource('/login', null);
});
app.factory('Logout', function($resource) {
  return $resource('/logout', null);
});
