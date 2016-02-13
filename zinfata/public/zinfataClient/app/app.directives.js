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
}])
.directive('uniqueEmail', ['Users', '$q', '$log', function(Users, $q, $log) {
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
}])
.directive('zMatch', function($log) {
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
})
.directive('zPlayer', ['$rootScope', 'QueueSvc', 'QUEUE', 'AUDIO', '$log', 'AuthenticationSvc', 'AUTH', 'MessageSvc',
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
      scope.track = QueueSvc.getCurrentTrack() && QueueSvc.getCurrentTrack().track;
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
}])
.directive('zAlbumListing', ['AlbumsSvc', 'SessionSvc', '$log', function(Albums, session, $log) {
  return {
    restrict: 'E',
    scope: {
      artist:  '='
    },
    link: function(scope, elm, attrs) {
      scope.isOwner = false;
      scope.albums = {};
      scope.queueUp = function(album) {
        // add every track in the queue. Add function in AlbumsSvc to do so.
      };

      scope.$watch(function(){ return scope.artist._id;}, function(val) {
        if(val !== undefined) {
          Albums.getByUser({ _id: val }, function(albums) {
            scope.albums = albums;
          }, function(err) {});
          if(!!session.getCurrentUser() && (val === session.getCurrentUser()._id)) scope.isOwner = true;
        } 
      });
    },
    templateUrl: '/templates/zAlbumListing'
  };
}])
.directive('zTrackListing', ['TracksSvc', 'SessionSvc', '$log', 
                            function(Tracks, session, $log) {
  return {
    restrict: 'E',
    scope: {
      for:  '='
    },
    link: function(scope, elm, attrs) {
      scope.isOwner   = false;
      scope.tracks    = [];
      scope.playlists = [];
      
      scope.$watch(function(){ return scope.for._id; }, function(val) {
        if(val !== undefined) {
          var resource = scope.for, //either an album or a playlist
              key      = attrs.type='album' ? 'a_id' : 'p_id',
              owner    = attrs.type='album' ? resource.artistId : resource.owner.id,
              param    = {}; 
          // populate search query with a_id || p_id as key and resource_id as value
          param[key] = resource._id; 
         
          Tracks.find(param , function(tracks) {
            angular.forEach(tracks, function(track) {
              Tracks.inflate(track._id, this, function(){}, function(){});
            }, scope.tracks);
          }, function(err) {});
          if(session.getCurrentUser() && (session.getCurrentUser()._id === owner)) scope.isOwner = true;
        } 
      });
    },
    templateUrl: '/templates/zTrackListing'
  };
}])
.directive('zPlaylistDropdown', ['$rootScope', 'PlaylistsSvc', 'PLAYLIST_EVENTS', 'SessionSvc', 'MessageSvc', '$log', 
                                function($rootScope, Playlists, PLAYLIST, session, Message, $log) {
  return {
    restrict: 'E',
    scope: {
      track: '='
    },
    link: function(scope, elm, attrs) {
      var currentUser = session.getCurrentUser();

      elm.addClass('dropdown-menu');

      scope.playlists = [];
      scope.playlist  = {
        title: '',
        owner: { id: '' }
      };
      scope.loggedIn  = '_id' in currentUser ? true : false;
      scope.adding    = 'track' in attrs && !!attrs.track ? true : false;
      
      if(scope.loggedIn) {
        Playlists.find({ u_id: currentUser._id }, function(playlists) {
          scope.playlists = playlists;
        }, function(err) {});
      }

      scope.create = function(playlist) {
        playlist.owner.id = currentUser._id;
        Playlists.create(playlist, function(created_playlist) {
          $rootScope.$broadcast(PLAYLIST.createSuccess);
          scope.playlists.push(playlist);
        }, function(err) {
          $rootScope.$broadcast(PLAYLIST.createFailed);
        });
      };

      scope.addToPlaylist = function(playlist, track) {
        Playlists.addTrack(playlist, track, function(){
          Message.addMsg('success', track.title + ' added to ' + playlist.title);
        }, function(){
          Message.addMsg('danger', 'Something went wrong adding track to playlist!');
        });
      };

      scope.$watch(function() { return session.getCurrentUser() && session.getCurrentUser()._id; }, 
                   function(newVal, oldVal) {
        if(newVal !== oldVal) {
          currentUser = session.getCurrentUser();
        }

        if('_id' in currentUser) {
          scope.loggedIn = true;
          Playlists.find({ u_id: currentUser._id }, function(playlists) {
            scope.playlists = playlists;
          }, function(err) {});

        listItems = elm.find('.list-group-item');
        }
      });
    },
    templateUrl: '/templates/zPlaylistDropdown'
  };
}]);