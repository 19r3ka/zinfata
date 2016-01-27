function FileDataObject(data) {
        var fd = new FormData();
        angular.forEach(data, function(value, key) {
            fd.append(key, value);
        });
        return fd;
}
app.factory('Users', ['$resource', function($resource) {
  return $resource('/api/users/:id', {id: '@_id'}, {
    'update': {
      method: 'PUT',
      transformRequest: FileDataObject ,
      headers: {
              'Content-Type': undefined,
              enctype:        'multipart/form-data'
      }
    },
    'find':           {method: 'GET', url: 'api/users/handle/:handle', params: {handle: '@handle'}, isArray: false },
    'resetPassword':  {method: 'GET', url: 'api/users/tokenize/:action/:email', params: {email: '@email', action: 'pwd-reset' }},
    'activate':       {method: 'GET', url: 'api/users/tokenize/:action/:email', params: {email: '@email', action: 'usr_activation' }},
    'verifyToken':    {method: 'GET', url: 'api/users/validate-token/:token', params: {token: '@token'}}
  });
}])
.factory('Albums', ['$resource', function($resource) {
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
}])
.factory('Playlists', ['$resource', function($resource) {
  return $resource('/api/playlists/:id', {id: '@_id'}, {
    'update': {method: 'PUT'},
    'find':   { method: 'GET', 
                isArray: true,
                url: '/api/playlists/:resource/:resource_id',
                params: {resource: '@owner', resource_id: '@ownerId'}
              }
  });
}])
.factory('Tracks', ['$resource', function($resource) {
  return $resource('/api/tracks/:id', {id: '@_id'}, {
    'update': {
            method:'PUT',
            transformRequest: FileDataObject ,
            headers: {
                    'Content-Type': undefined,
                    enctype:        'multipart/form-data'
            }
    },
    'save': {
            method: 'POST',
            transformRequest: FileDataObject,
            headers: {
                    'Content-Type': undefined,
                    enctype:        'multipart/form-data'
            }
    }
  });
}])
.factory('AccessToken', function($resource){
  return $resource('/zinfataclient/:resource', {resource: '@resource'}, {
    'getUser': {
      method: 'GET',
      params: {resource: 'me'}
    },
    'getFor': {
      method: 'POST'
    },
    'revoke':  {
      method: 'POST',
      params: {resource: 'revoke'}
    },
    'refresh': {
      method: 'POST',
      params: {resource: 'refresh'}
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
}])
.factory('sessionStore', ['$window', '$rootScope', '$log', 
                        function($window, $rootScope, $log){
  /* Implements access to the session store to enable saving
     logged user and access token */

  /* automatically alerts any element relying on the value of 
     local stored items */   
  /*angular.element($window).on('storage', function(event) {
    $rootScope.$apply();
  });*/
  return {
    setData: function(store, val) {
      /*$window.localStorage && */$window.sessionStorage.setItem(store, angular.toJson(val));
      return this;
    },
    getData: function(store) {
      var data = $window.sessionStorage && $window.sessionStorage.getItem(store);
      return angular.fromJson(data);
    },
    deleteData: function(store) {
      return $window.sessionStorage && $window.sessionStorage.removeItem(store);
    }
  };
}])
.factory('APIInterceptor', ['$rootScope', '$q', '$location', '$log', 'sessionStore',
                           function($rootScope, $q, $location, $log, store){

  return {
    request: function(config) {
      var accessKeys  = store.getData('accessKeys'),
          accessToken = accessKeys ? accessKeys.access_token : null; 

      if(accessToken) {
        config.headers.authorization = accessToken;
      }

      return config;
    },
    responseError: function(rejection) {
      if(response.status === 401 && response.data.error && response.data.error === 'invalid_token') {
        var deferred      = $q.defer(),
            accessKeys    = store.getData('accessKeys'),
            refreshToken  = accessKeys ? accessKeys.refresh_token : null,
            req           = {
              method: 'POST',
              url:    '/zinfataclient/refresh',
              data:   {refresh_token: refreshToken}  
            };

        $http(req).then(function(new_keys) {
          store.setData('accessKeys', new_keys);
          $http(response.config).then(function(new_response) {
            deferred.resolve(response);
          }, function(err) {
            deferred.reject();
          });
        }, function(err) {
          deferred.reject();
          $location.path('login');
          return;
        });
      }

      return $q.reject(rejection);
    }
  };
}]);
