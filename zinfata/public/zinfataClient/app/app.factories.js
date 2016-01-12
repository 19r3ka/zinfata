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
    'resetPassword': {method:'GET', url: 'api/users/reset-password/:email'},
    'verifyToken': {method:'GET', url: 'api/users/reset-password/validate-token/:token', params: {get_user: '@get_user'}}
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
      $window.localStorage && $window.localStorage.setItem(store, angular.toJson(val));
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
.factory('Auth', ['$http', '$rootScope', 'Session', 'MessageSvc', 'AUTH_EVENTS', '$log', 
                  function($http, $rootScope, Session, MessageSvc, AUTH_EVENTS, $log) {
  return {
    login: function(credentials, success, failure) {
      return $http.post('/login', credentials).then(function(res) {
        return success(res.data);
      }, function(err) {
        return failure(err);
      });
    },
    logout: function(success, failure) {
      return $http.get('/logout').then(function() {
        return success();
      }, function(err) {
        return failure(err);
      });
    },
    currentUser: function(success, failure) {
      return $http.get('/currentuser').then(function(res) {
        $rootScope.$broadcast(AUTH_EVENTS.isAuthenticated, res.data);
        success(res.data);
      }, function(err) {
        $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
        return {};
      });
    },
    isAuthenticated: function() {
      return !!Session.getUser().id;
    },
    isAuthorized: function(authorizedRoles) {
      if(!angular.isArray(authorizedRoles)) {
        authorizedRoles = [authorizedRoles];
      }
      return (isAuthenticated && authorizedRoles.indexOf(Session.userRole) !== -1);
    }
  };
}]);
