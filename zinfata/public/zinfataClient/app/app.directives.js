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
        if(modelValue === scope.firstPassword) {
          return true;
        }
        return false;
      };
    }
  };
});

app.directive('zPlayer', ['$rootScope', '$interval', 'QUEUE', 'AUDIO', '$log', function($rootScope, $interval, QUEUE, AUDIO, $log) {
  return {
    restrict: 'E',
    link: function(scope, elm, attrs, ctrl) {
      // scope.audio = new Audio();
      player = elm.find('audio')[0];

      // scope.audio.addEventListener('play', function() {
      player.addEventListener('play', function() {
        $rootScope.$broadcast(AUDIO.playing, scope.track);
      });
      
      // scope.audio.addEventListener('pause', function() {
      player.addEventListener('pause', function() {
        $rootScope.$broadcast(AUDIO.paused, scope.track);
      });
      
      // scope.audio.addEventListener('ended', function() {
      player.addEventListener('ended', function() {
        $rootScope.$broadcast(AUDIO.ended, scope.track);
        scope.next();
      });

      scope.playing = !player.paused; //scope.audio.paused;
      scope.volume  = '';
      scope.track   = {};

      scope.$on(AUDIO.set, function(event, track) {
        scope.track = track; 
        player.src  = track.streamUrl;
        player.play(); 
        /*scope.audio.src = track.streamUrl;
        scope.audio.play();*/ 
      });

      scope.$on('$destroy', function() {
        player.paused;
        if(angular.isDefined(stop)) {
          $interval.cancel(stop);
          stop = undefined;
        }
      });

      scope.next = function() {
        $log.debug('broadcasted audio.next');
        $rootScope.$broadcast(QUEUE.next);
      };

      scope.prev = function() {
        $rootScope.$broadcast(QUEUE.prev);
      };

      scope.playPause = function() {
        // scope.audio.paused ? scope.audio.play() : scope.audio.pause();
        player.paused? player.play() : player.pause();
      };

      // var stop = $interval(function() { scope.$apply(); }, 500);
    },
    templateUrl: '/templates/zPlayer'
  };
}]);