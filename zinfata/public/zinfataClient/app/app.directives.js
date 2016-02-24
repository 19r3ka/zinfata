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
      if(!Auth.isAuthenticated() || !scope.track || !scope.track.streamUrl) elm.hide();
      scope.$watch(function() { return Auth.isAuthenticated() && (scope.track && !!scope.track.streamUrl) },  function(newVal, oldVal) {
        if(!!newVal) {
          elm.show();
        } else {
          elm.hide();
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
      if(scope.track) {
        player.src = scope.track.streamUrl;
      }

      scope.$on(AUDIO.playPause, function() {
        scope.playPause();
      });

      scope.$on(AUDIO.set, function(event, track) {
        scope.track = track; 
        player.src  = track.streamUrl;
        // player.play();
        if(!Auth.isAuthenticated()) {
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
        player.paused ? player.play() : player.pause();
      };

      // var stop = $interval(function() { scope.$apply(); }, 500);
    },
    templateUrl: '/templates/zPlayer'
  };
}])
.directive('zAlbumListing', ['AlbumsSvc', 'TracksSvc', 'SessionSvc', '$log', function(Albums, Tracks, session, $log) {
  return {
    restrict: 'E',
    scope: {
      artist:  '='
    },
    link: function(scope, elm, attrs) {
      scope.isOwner = false;
      scope.albums = [];
      scope.queueUp = function(album) {
        // add every track in the queue. Add function in AlbumsSvc to do so.
      };

      scope.$watch(function(){ return scope.artist._id;}, function(val) {
        if(val !== undefined) {
          Albums.getByUser({ _id: val }, function(albums) {
            angular.forEach(albums, function(album) {
              album.duration    = 0;
              album.trackLength = 0;
              Tracks.find({a_id: album._id} , function(tracks) {
                angular.forEach(tracks, function(track) {
                    album.trackLength++;
                    duration       = parseInt(track.duration);
                    album.duration += duration;
                });
              }, function(err) {});
              this.push(album);
            }, scope.albums);
            // scope.albums = albums;
          }, function(err) {});
          if(!!session.getCurrentUser() && (val === session.getCurrentUser()._id)) scope.isOwner = true;
        } 
      });
    },
    templateUrl: '/templates/zAlbumListing'
  };
}])
.directive('zTrackListing', ['TracksSvc', 'SessionSvc', 'QueueSvc', '$log', 
                            function(Tracks, session, Queue, $log) {
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

      scope.play = function(track) {
        Queue.playNow(track);
      };

      scope.addToQueue = function(track) {
        Queue.addTrack(track);
      };
    },
    templateUrl: '/templates/zTrackListing'
  };
}])
.directive('zDetailedTrackListing', ['PlaylistsSvc', 'QueueSvc', '$log', 
                                  function(Playlists, Queue, $log) {
  return {
    restrict: 'E',
    scope: {
      tracks: '=',
      remove: '&onRemove'
    },
    link: function(scope, elm, attrs) {
      scope.play = function(track) {
        Queue.playNow(track);
      };

      scope.addToQueue = function(track) {
        Queue.addTrack(track);
      };
    },
    templateUrl: '/templates/zDetailedTrackListing'
  };
}])
.directive('zPlaylistDropdown', ['$rootScope', 'PlaylistsSvc', 'PLAYLIST_EVENTS', 'AUTH', 'SessionSvc', 'MessageSvc', '$log', 
                                function($rootScope, Playlists, PLAYLIST, AUTH, session, Message, $log) {
  return {
    restrict: 'E',
    scope: {
      track: '='
    },
    link: function(scope, elm, attrs) {
      var currentUser = session.getCurrentUser();

      function refresh() {
        if(!currentUser) return;
        Playlists.find({ u_id: currentUser._id }, function(playlists) {
          scope.playlists = playlists;
        }, function(err) {});
      }

      elm.addClass('dropdown-menu');

      scope.playlists = [];
      scope.playlist  = {
        title: '',
        owner: { id: '' }
      };
      scope.loggedIn  = currentUser && '_id' in currentUser ? true : false;
      scope.adding    = 'track' in attrs && !!attrs.track ? true : false;
      
      if(scope.loggedIn) refresh();

      scope.create = function(playlist) {
        playlist.owner.id = currentUser._id;
        Playlists.create(playlist, function(created_playlist) {
          $rootScope.$broadcast(PLAYLIST.createSuccess);
          scope.playlists.push(playlist);
          scope.playlist.title = '';
        }, function(err) {
          $rootScope.$broadcast(PLAYLIST.createFailed);
        });
      };

      scope.addToPlaylist = function(event, playlist, track) {
        if(!scope.adding) return;
        event.preventDefault();
        Playlists.addTrack(playlist, track, function(){
          Message.addMsg('success', track.title + ' added to ' + playlist.title);
        }, function() {
          Message.addMsg('danger', 'Something went wrong adding track to playlist!');
        });
      };

      scope.$watch(function() { return session.getCurrentUser() && session.getCurrentUser()._id; }, 
                   function(newVal, oldVal) {
        if(newVal !== oldVal) {
          currentUser = session.getCurrentUser();
        }

        if(currentUser) {
          scope.loggedIn = true;
          refresh();
        }
      });

      scope.$on(PLAYLIST.updateSuccess, function() {
        refresh();
      });
      scope.$on(PLAYLIST.creationSuccess, function() {
        refresh();
      });
      scope.$on(PLAYLIST.deleteSuccess, function() {
        refresh();
      });
      scope.$on(AUTH.loginSuccess, function() {
        scope.loggedIn = true;
        refresh();
      });
    },
    templateUrl: '/templates/zPlaylistDropdown'
  };
}]);