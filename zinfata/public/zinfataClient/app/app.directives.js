app.directive('uniqueHandle', ['Users', '$q', '$log', function(Users, $q, $log) {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      var users = [];

      Users.query(function(data) {
        for(i = 0; i < data.length; i++) {
          users.push(data[i].handle);
        }

        ctrl.$asyncValidators.uniquehandle = function(modelValue, viewValue) {
          var defer = $q.defer();
          if(users.indexOf(modelValue) === -1){
            defer.resolve();
          }else{
            defer.reject();
          }
          return defer.promise;
        };
      });
    }
  }
}]);

app.directive('uniqueEmail', ['Users', '$q', '$log', function(Users, $q, $log) {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      var users = [];

      Users.query(function(data) {
        for(i = 0; i < data.length; i++) {
          users.push(data[i].email);
        }

        ctrl.$asyncValidators.uniqueemail = function(modelValue, viewValue) {
          var defer = $q.defer();
          if(users.indexOf(modelValue) === -1){
            defer.resolve();
          }else{
            defer.reject();
          }
          return defer.promise;
        };
      });
    }
  };
}]);

app.directive('zMatch', function($log) {
  return {
    require: 'ngModel',
    scope: {
      firstPassword: '=zMatch'
    },
    link: function(scope, elm, attrs, ctrl) {
      ctrl.$validators.pwmatch = function(modelValue, viewValue) {
        $log.debug('The value of firstPassword is: ' + scope.firstPassword);
        $log.debug('The model value is: ' + modelValue);
        if(modelValue === scope.firstPassword) {
          return true;
        }
        return false;
      };
    }
  };
});
