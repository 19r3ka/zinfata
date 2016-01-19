function FileDataObject(data) {
        var fd = new FormData();
        angular.forEach(data, function(value, key) {
            fd.append(key, value);
        });
        return fd;
}
app.factory('Users', function($resource) {
  return $resource('/api/users/:id', {id: '@_id'}, {
     'update': {
            method: 'PUT',
            transformRequest: FileDataObject ,
            headers: {
                    'Content-Type': undefined,
                    enctype:           'multipart/form-data'
            }
    },
    'resetPassword':  {method:'GET', url: 'api/users/tokenize/:action/:email', params: {email: '@email', action: 'pwd-reset' }},
    'activate':       {method:'GET', url: 'api/users/tokenize/:action/:email', params: {email: '@email', action: 'usr_activation' }},
    'verifyToken':    {method:'GET', url: 'api/users/validate-token/:token', params: {token: '@token'}}
  });
})
.factory('Albums', function($resource) {
  return $resource('/api/albums/:id', {id: '@_id'}, {
    'update': {
            method:'PUT',
            transformRequest: FileDataObject ,
            headers: {
                    'Content-Type': undefined,
                    enctype:        'multipart/form-data'
            }
    },
    'save':     {
            method: 'POST',
            transformRequest: FileDataObject,
            headers: {
                    'Content-Type': undefined,
                    enctype:        'multipart/form-data'
            }
    },
    'getByUser': {
			method:'GET',
			url: '/api/albums/user/:user_id',
			params: {user_id: '@_id'},
			isArray: true
    }
  });
})
.factory('Playlists', function($resource) {
  return $resource('/api/playlists/:id', {id: '@_id'}, {
    'update': {method: 'PUT'},
    'find':   { method: 'GET', 
                isArray: true,
                url: '/api/playlists/:resource/:resource_id',
                params: {resource: '@owner', resource_id: '@ownerId'}
              }
  });
})
.factory('Tracks', function($resource) {
  return $resource('/api/tracks/:id', {id: '@_id'}, {
    'update': {
            method:'PUT',
            transformRequest: FileDataObject ,
            headers: {
                    'Content-Type': undefined,
                    enctype:        'multipart/form-data'
            }
    },
    'save':     {
            method: 'POST',
            transformRequest: FileDataObject,
            headers: {
                    'Content-Type': undefined,
                    enctype:        'multipart/form-data'
            }
    }
  });
})
.factory('localStore', ['$window', '$rootScope', '$log', 
                        function($window, $rootScope, $log){
  /* Implements access to the local store to enable saving
     queued tracks from one page to the other */

  /* automatically alerts any element relying on the value of 
     local stored items */   
  angular.element($window).on('storage', function(event) {
    $rootScope.$apply();
  });
  return {
    setData: function(store, val) {
      /*$window.localStorage && */$window.localStorage.setItem(store, angular.toJson(val));
      return this;
    },
    getData: function(store) {
      var data = $window.localStorage && $window.localStorage.getItem(store);
      return angular.fromJson(data);
    },
    deleteData: function(store) {
      return $window.localStorage && $window.localStorage.removeItem(store);
    }
  };
}]);
