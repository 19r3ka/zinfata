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
  };
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

app.directive('zPlayer', ['$rootScope', 'QueueSvc', 'QUEUE', 'AUDIO', '$log', 'AuthenticationSvc', 'AUTH', 'MessageSvc',
                          function($rootScope, QueueSvc, QUEUE, AUDIO, $log, Auth, AUTH, MessageSvc) {
  return {
    restrict: 'E',
    link: function(scope, elm, attrs, ctrl) {
      /*Originally hide the player given that
        by default, noone should come logged in.*/
      if(!Auth.isAuthenticated()) elm.hide();
      
      scope.$watch(function() { return Auth.isAuthenticated(); },  function(newVal, oldVal){
        if(newVal !== oldVal){
          if(!!newVal){
            elm.show();
          }else{
            elm.hide();
          }
        }
      });

      // scope.audio = new Audio();
      var player = elm.find('audio')[0];

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
      /* On reload fetch and set last played song. */
      scope.track   = QueueSvc.getCurrentTrack().track;
      if(scope.track) player.src = scope.track.streamUrl;

      scope.$on(AUDIO.set, function(event, track) {
        scope.track = track; 
        player.src  = track.streamUrl;
        // player.play();
        if(Auth.isAuthenticated()){
          scope.playPause();
        } else {
          $rootScope.$broadcast(AUTH.notAuthenticated);
          MessageSvc.addMsg('danger', 'Log in first to access that resource!');
        } 
        /*scope.audio.src = track.streamUrl;
        scope.audio.play();*/ 
      });

      scope.next = function() {
        //$rootScope.$broadcast(QUEUE.next);
        QueueSvc.playNext();
      };

      scope.prev = function() {
        //$rootScope.$broadcast(QUEUE.prev);
        QueueSvc.playPrev();
      };

      scope.playPause = function() {
        // scope.audio.paused ? scope.audio.play() : scope.audio.pause();
        (player.paused ? player.play : player.pause)();
      };

      // var stop = $interval(function() { scope.$apply(); }, 500);
    },
    templateUrl: '/templates/zPlayer'
  };
}]);