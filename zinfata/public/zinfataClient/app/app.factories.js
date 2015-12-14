function FileDataObject(data) {
        var fd = new FormData();
        angular.forEach(data, function(value, key) {
            fd.append(key, value);
        })
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
  return $resource('/api/playlists/:id', null, {
    'update': {method:'PUT'}
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
.factory('Auth', ['$http', '$rootScope', 'Session', 'MessageSvc', '$log', function($http, $rootScope, Session, MessageSvc, $log) {
  return {
    login: function(credentials, success, failure) {
      return $http.post('/login', credentials).then(function(res) {
        Session.create(res.data._id, res.data.role);
        return success(res.data);
      }, function(err) {
        $log.error('Unable to log user in: ' + angular.toJson(err));
        return failure(err);
      });
    },
    logout: function(success, failure) {
      return $http.get('/logout').then(function() {
        Session.destroy();
        return success();
      }, function(err) {
        $log.error('Unable to log user out: ' + angular.toJson(err));
        return failure(err);
      });
    },
    currentUser: function(success, failure) {
      return $http.get('/currentuser').then(function(res) {
        Session.create(res.data._id, res.data.role);
        return success(res.data);
      }, function(err) {
        $log.error('No current user session found on server: ' + angular.toJson(err));
        return {};
      });
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
