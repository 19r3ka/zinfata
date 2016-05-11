var app      = angular.module('zinfataClient', ['dispatcher', 'ngRoute', 'ngResource', 'ngMessages', 'ngImgCrop']),
    dispatch = angular.module('dispatcher', []);

app.constant('ROUTES', {
  loginEndpoint:        'zinfataclient',
  serverHost:           'XXXXX'
})
.constant('AUTH', {
  loginSuccess:         'auth-login-success',
  loginFailed:          'auth-login-failed',
  mustLogIn:            'auth-log-in-first',
  logoutSuccess:        'auth-logout-success',
  logoutFailed:         'auth-logout-failed',
  sessionTimeout:       'auth-session-timeout',
  authenticated:        'auth-authenticated',
  notAuthenticated:     'auth-not-authenticated',
  authorized:           'auth-authorized',
  notAuthorized:        'auth-not-authorized'
})
.constant('USER_ROLES', {
  admin:  'admin',
  artist: 'artist',
  guest:  'guest'
})
.constant('PWD_TOKEN', {
  sendSuccess:          'token-sent-success',
  sendFailed:           'token-sent-failed',
  verificationSuccess:  'token-verification-success',
  verificationFailed:   'token-verification-failed'
})
.constant('USER_EVENTS', {
  updateSuccess:        'user-update-success',
  updateFailed:         'user-update-failed',
  createSuccess:      'user-creation-success',
  createFailed:       'user-creation-failed',
  accountActivated:     'user-account-activated',
  accountNotActivated:  'user-account-not-activated',
  deleteSuccess:        'user-delete-success',
  deleteFailed:         'user-delete-failed'
})
.constant('ALBUM_EVENTS', {
  createSuccess:        'album-creation-success',
  createFailed:         'album-creation-failed',
  updateSuccess:        'album-update-success',
  updateFailed:         'album-update-failed',
  deleteSuccess:        'album-delete-success',
  deleteFailed:         'album-delete-failed'
})
.constant('TRACK_EVENTS', {
  updateSuccess:        'track-update-success',
  updateFailed:         'track-update-failed',
  createSuccess:      'track-creation-success',
  createFailed:       'track-creation-failed',
  deleteSuccess:        'track-delete-success',
  deleteFailed:         'track-delete-failed',
  downloadSuccess:      'track-download-success',
  downloadFailed:       'track-download-failed'
}).constant('PLAYLIST_EVENTS', {
  updateSuccess:        'playlist-update-success',
  updateFailed:         'playlist-update-failed',
  createSuccess:      'playlist-creation-success',
  createFailed:       'playlist-creation-failed',
  deleteSuccess:        'playlist-delete-success',
  deleteFailed:         'playlist-delete-failed'
}).constant('QUEUE', {
  next:                 'queue-next-track',
  prev:                 'queue-previous-track'
}).constant('AUDIO', {
  set:                  'audio-set',
  playPause:           'audio-play-pause',
  playing:              'audio-playing',
  paused:               'audio-paused',
  ended:                'audio-ended'
});

app.directive('uniqueHandle', ['Users', '$q', '$log', '$filter',
  function(Users, $q, $log, $filter) {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      var users  = [];
      var handle = '';

      Users.query(function(data) {
        /* Always do the comparison with handles lowercased */
        for (i = 0; i < data.length; i++) {
          handle = $filter('lowercase')(data[i].handle);
          users.push(handle);
        }
        ctrl.$asyncValidators.uniquehandle = function(modelValue, viewValue) {
          var defer = $q.defer();
          var entry = $filter('lowercase')(modelValue);
          if (users.indexOf(entry) === -1) {
            defer.resolve();
          } else {
            defer.reject();
          }
          return defer.promise;
        };
      });
    }
  };
}])
.directive('uniqueEmail', ['Users', '$q', '$log', '$filter',
  function(Users, $q, $log, $filter) {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      var users = [];

      Users.query(function(data) {
        for (i = 0; i < data.length; i++) {
          users.push($filter('lowercase')(data[i].email));
        }

        ctrl.$asyncValidators.uniqueemail = function(modelValue, viewValue) {
          var defer = $q.defer();
          var entry = $filter('lowercase')(modelValue);

          if (users.indexOf(entry) === -1) {
            defer.resolve();
          } else {
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
        if (modelValue === scope.firstPassword) {
          return true;
        }
        return false;
      };
    }
  };
})
.directive('zDropdown', ['$document', '$window', function(doc, win) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      var menu = doc.getElementByClassName('z-dropdown-menu');
      /*Show/hide dropdown menu alternatively when user click on toggle*/
      scope.toggleContent = function() {
        menu.classList.toggle('z-show');
      };
      /* Hide dropdown when user clicks elsewhere */
      win.onclick = function(event) {
        if (!event.target.matches('z-dropdown-toggle')) {
          if (menu.classList.contains('z-show')) {
            menu.classList.remove('z-show');
          }
        }
      };
    }
  };
}])
.directive('zPlayer', ['$rootScope', 'QueueSvc', 'QUEUE', 'AUDIO', '$log',
           'AuthenticationSvc', 'AUTH', 'MessageSvc',
  function($rootScope, QueueSvc, QUEUE, AUDIO, $log, Auth, AUTH, MessageSvc) {
  return {
    restrict: 'E',
    link: function(scope, elm, attrs, ctrl) {
      if (!Auth.isAuthenticated() || !scope.track || !scope.track.streamUrl) {
        elm.hide();
      }
      scope.$watch(function() {
        return Auth.isAuthenticated() && (scope.track && !!scope.track.streamUrl);
      }, function(newVal, oldVal) {
        if (!!newVal) {
          elm.show();
        } else {
          elm.hide();
        }
      });

      // scope.audio = new Audio();
      //var player = elm.find('audio')[0];
      scope.playing = false;
      scope.currentTime = 0;
      scope.isLoggedIn = Auth.isAuthenticated;
      var expander = document.getElementById('expand-player-controllers');
      var compresser = document.getElementById('compress-player-controllers');
      var zplayerBottom = document.getElementById('z-player-bottom');

      window.addEventListener('resize', function() {
        if (document.documentElement.clientWidth >= 598 && zplayerBottom.className.match(/\s*expand-mobile/g)) {
          zplayerBottom.className =  zplayerBottom.className.replace(/expand-mobile/g, '');
        }
      });

      expander.addEventListener('click', function() {
        if (!zplayerBottom.className.match(/\s+expand-mobile/)) {
          zplayerBottom.className += 'expand-mobile';
        }
      });

      compresser.addEventListener('click', function() {
        console.log(zplayerBottom.className);
        if (zplayerBottom.className.match(/\s*expand-mobile/)) {
          zplayerBottom.className = zplayerBottom.className.replace(/expand-mobile/g, '');
        }
      });

      var player = document.createElement('audio');
      player.volume = 0.5;
      var trackDurationSlider =
        document.getElementById('track-duration-slider');
      var playerVolumeSlider  =
        document.getElementById('player-volume-slider');

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

      player.addEventListener('timeupdate', updateProgressBar);
      trackDurationSlider.addEventListener('change', updateTrackCurrenTime);
      trackDurationSlider.addEventListener('input', updateTrackCurrenTime);

      playerVolumeSlider.addEventListener('change', updatePlayerVolume);
      playerVolumeSlider.addEventListener('input', updatePlayerVolume);

      function updateProgressBar() {
        var progressWidth = '';
        var trackCurrentTime = player.currentTime;
        var tarckDuration = player.duration;
        scope.currentTime = trackCurrentTime;

        var currentTimePercentage =
          Math.floor((100 * trackCurrentTime) / tarckDuration);
        //document.querySelector('.duration-spin').style.width = currentTimePercentage + '%';
        trackDurationSlider.value = currentTimePercentage;
        scope.$apply();
      }

      function  updateTrackCurrenTime() {
        player.currentTime = trackDurationSlider.value * player.duration / 100;
        scope.$apply();
      }

      function  updatePlayerVolume() {
        player.volume = playerVolumeSlider.value / 100;
        scope.$apply();
        console.log(player.volume);
      }

      //scope.playing = !player.paused; //scope.audio.paused;
      /* On reload fetch and set last played song. */
      scope.track =
        QueueSvc.getCurrentTrack() && QueueSvc.getCurrentTrack().track;
      if (scope.track) {
        player.src = scope.track.streamUrl;
      }

      scope.$on(AUDIO.playPause, function() {
        scope.playPause();
      });

      scope.$on(AUDIO.ended, function() {
        scope.stop();
      });

      scope.$on(AUTH.logoutSuccess, function() {
        scope.stop();
        scope.track = {};
      });

      scope.$on(AUTH.notAuthenticated, function() {
        scope.stop();
      });

      scope.$on(AUDIO.set, function(event, track) {
        scope.track = track;
        player.src  = track.streamUrl;
        scope.duration = player.duration;

        if (!Auth.isAuthenticated()) {
          $rootScope.$broadcast(AUTH.notAuthenticated);
          MessageSvc.addMsg('danger', 'Log in first to play music!');
        } else {
          scope.playPause();
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
        scope.playing = player.paused || player.ended ? false : true;
      };

      scope.stop = function() {
        player.pause();
        scope.playing = false;
        player.currentTime = 0;
      };

      scope.mute = function() {
        player.muted = !player.muted;
      };

      scope.muted = function() {
        return player.muted;
      };

      // var stop = $interval(function() { scope.$apply(); }, 500);
    },
    templateUrl: '/templates/zPlayer'
  };
}])
.directive('zAlbumListing', ['AlbumsSvc', 'TracksSvc', 'SessionSvc', '$log',
  function(Albums, Tracks, session, $log) {
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

      scope.$watch(function() { return scope.artist._id;}, function(val) {
        if (val !== undefined) {
          Albums.getByUser({_id: val}, function(albums) {
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
          if (!!session.getCurrentUser() &&
            (val === session.getCurrentUser()._id)) {
            scope.isOwner = true;
          }
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

      scope.$watch(function() { return scope.for._id; }, function(val) {
        if (val !== undefined) {
          var resource = scope.for; //either an album or a playlist
          var key      = attrs.type = 'album' ? 'a_id' : 'p_id';
          var owner    =
            attrs.type = 'album' ? resource.artist.id : resource.owner.id;
          var param    = {};
          // populate search query with a_id || p_id as key and resource_id as value
          param[key] = resource._id;

          Tracks.find(param , function(tracks) {
            angular.forEach(tracks, function(track) {
              Tracks.inflate(track._id, this, function() {}, function() {});
            }, scope.tracks);
          }, function(err) {});

          if (session.getCurrentUser() &&
            (session.getCurrentUser()._id === owner)) {
            scope.isOwner = true;
          }
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
.directive('zSearchBox', ['PlaylistsSvc', 'TracksSvc', 'AlbumsSvc', 'UsersSvc',
                         function(Playlists, Tracks, Albums, Users) {
  return {
    restrict: 'E',
    link: function(scope, elm, attrs) {
      scope.playlists  = scope.tracks = scope.albums = scope.users = [];
      if (angular.isUndefined(scope.searchTerm)) {
        scope.searchTerm = '';
      }
      scope.playlists = Playlists.all;
      scope.tracks    = Tracks.all;
      scope.albums    = Albums.all;
      scope.users     = Users.all;

      /*Playlists.query(function(playlists) {
        scope.playlists = playlists;
      });
      Tracks.query(function(tracks) {
        scope.tracks = tracks;
      });
      Albums.query(function(albums) {
        scope.albums = albums;
      });
      Users.query(function(users) {
        scope.users = users;
      });*/
    },
    templateUrl: '/templates/zSearchBox'
  };
}])
.directive('zPlaylistDropdown', ['$rootScope', 'PlaylistsSvc',
'PLAYLIST_EVENTS', 'AUTH', 'AuthenticationSvc', 'SessionSvc', 'MessageSvc',
'$log', function($rootScope, Playlists, PLAYLIST, AUTH, Auth, session,
Message, $log) {
  return {
    restrict: 'E',
    scope: {
      track: '='
    },
    link: function(scope, elm, attrs) {
      // elm.addClass('dropdown-menu');
      elm.addClass('z-dropdown-menu');

      var currentUser = session.getCurrentUser();
      scope.playlists = [];
      scope.playlist  = {
        title: '',
        owner: {id: ''}
      };
      scope.loggedIn  = Auth.isAuthenticated();

      if (attrs.track) {
        scope.adding = true;
      }

      function refresh() {
        if (!currentUser) {
          scope.playlists = [];
          return;
        }
        Playlists.find({u_id: currentUser._id}, function(playlists) {
          scope.playlists = playlists;
        }, function(err) {});
      }

      scope.$watch(function() { return Auth.isAuthenticated(); },
                   function(newVal, oldVal) {
        if (newVal !== oldVal) {
          if (!!newVal) {
            currentUser = session.getCurrentUser();
          }
          refresh();
        }
      });
      scope.$on(PLAYLIST.updateSuccess, function() {
        refresh();
      });
      scope.$on(PLAYLIST.createSuccess, function() {
        refresh();
      });
      scope.$on(PLAYLIST.deleteSuccess, function() {
        refresh();
      });
      scope.$on(AUTH.loginSuccess, function() {
        refresh();
      });

      if (scope.loggedIn) {
        refresh();
      }

      scope.create = function(playlist) {
        playlist.owner.id = currentUser._id;
        Playlists.create(playlist, function(createdPlaylist) {
          $rootScope.$broadcast(PLAYLIST.createSuccess, createdPlaylist);
          scope.playlist.title = '';
        }, function(err) {
          $rootScope.$broadcast(PLAYLIST.createFailed);
        });
      };

      scope.addToPlaylist = function(event, playlist, track) {
        if (!scope.adding) {
          return;
        }
        event.preventDefault();
        Playlists.addTrack(playlist, track, function() {
          Message.addMsg('success',
            track.title + ' added to ' + playlist.title);
        }, function() {
          Message.addMsg('danger',
            'Something went wrong adding track to playlist!');
        });
      };
    },
    templateUrl: '/templates/zPlaylistDropdown'
  };
}])
.directive('zImgCrop', function() {
  return {
    restrict: 'E',
    scope: {
      onImgReady: '&'
    },
    link: function(scope) {
      scope.rawImage = scope.croppedImage = '';
      scope.cropPending = false;

      scope.readFile = function(elem) {
        var file   = elem.files[0];
        var reader = new FileReader();
        reader.onload = function() {
          scope.$apply(function() {
            scope.rawImage    = reader.result;
            scope.cropPending = true;
          });
        };
        reader.readAsDataURL(file);
      };

      scope.updateAvatar = function(image) {
        var data = {
          file: dataURItoBlob(image),
          url:  image
        };
        scope.cropPending = false;
        return scope.onImgReady({imgFile: data});
      };
      /*
      * Converts data uri to Blob. Necessary for uploading.
      * @see http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
      * @param  {String} dataURI
      * @return {Blob}
      */
      var dataURItoBlob = function(dataURI) {
        var binary     = atob(dataURI.split(',')[1]);
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        var array      = [];

        for (var i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
        }

        return new Blob([new Uint8Array(array)], {type: mimeString});
      };
    },
    templateUrl: '/templates/zImgCrop'
  };
})
.directive('zMessageBox', ['$rootScope', 'MessageSvc', '$timeout',
function($rootScope, MessageSvc, $timeout) {
  return {
    restrict: 'E',
    link: function(scope, elm, attrs) {
      scope.$watch(function() {
        return MessageSvc.getMsg();
      }, function(newVal, oldVal) {
        if (!!newVal) {
          scope.message = newVal;
          elm.show();
          scope.icon    = (scope.message.type === 'success') ?
          'fa fa-check' : 'fa fa-exclamation';
          timeout(function() {
            elm.hide();
          }, 5000);
        }
      });
    },
    templateUrl: '/template/zMessageBox'
  };
}])
.directive('zAlbumCreator', ['$rootScope', '$document', 'AlbumsSvc',
  'SessionSvc', 'ALBUM_EVENTS',
  function($rootScope, doc, Albums, Session, ALBUM) {
  return {
    restrict: 'E',
    scope: {
      album: '='
    },
    link: function(scope, elm, attrs) {
      scope.save = function(album) {
        if (!album.artistId) {
          album.artist    = {};
          album.artist.id = Session.getCurrentUser()._id;
        }
        album.releaseDate = new Date();
        Albums.create(album, function(createdAlbum) {
          $rootScope.$broadcast(ALBUM.createSuccess, createdAlbum);
        }, function(err) {
          $rootScope.$broadcast(ALBUM.createFailed);
        });
      };
    },
    templateUrl: '/templates/zAlbumCreator'
  };
}]);

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
      transformRequest: FileDataObject,
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
      transformRequest: FileDataObject,
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
      url: '/api/albums/user/:userId',
      params: {userId: '@_id'},
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
      params: {resource: '@resource', resource_id: '@resource_id'}
    }
  });
}])
.factory('Tracks', ['$resource', function($resource) {
  return $resource('/api/tracks/:id', {id: '@_id'}, {
    'update': {
      method: 'PUT',
      transformRequest: FileDataObject,
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
    },
    'find': { 
      method: 'GET',
      isArray: true,
      url: '/api/tracks/:resource/:resource_id',
      params: {resource: '@resource', resource_id: '@resoureceId'}
    },
    'download': {
      method: 'GET',
      url: '/api/tracks/:id/download',
      params : {id: '@_id'}  
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
.factory('APIInterceptor', ['$rootScope', '$q', '$location', '$log', 'sessionStore', '$httpParamSerializer', '$injector',
                           function($rootScope, $q, $location, $log, store, serialize, $injector) {

  return {
    request: function(config) {
      var accessKeys  = store.getData('accessKeys'),
          accessToken = accessKeys ? accessKeys.access_token : null; 
    
      if(accessToken) {
        config.headers.authorization = 'Bearer ' + accessToken;
      }

      if(config.url.search('zinfataclient') !== -1) {
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        config.data = serialize(config.data);
      }

      return config;
    },
    responseError: function(rejection) {
      if(rejection.status === 401 && rejection.data.error && rejection.data.error === 'invalid_token') {
        var deferred      = $q.defer(),
            http          = $injector.get('$http'),
            accessKeys    = store.getData('accessKeys'),
            refreshToken  = accessKeys ? accessKeys.refresh_token : null,
            req           = {
              method: 'POST',
              url:    '/zinfataclient/refresh',
              data:   {refresh_token: refreshToken}  
            };

        http(req).then(function(new_keys) {
          store.setData('accessKeys', new_keys.data);
          http(rejection.config).then(function(new_response) {
            deferred.resolve(new_response);
          }, function(err) {
            deferred.reject();
          });
        }, function(err) {
          deferred.reject();
          store.deleteData('accessKeys');
          store.deleteData('currentUser');
          $location.path('login');
          return;
        });
        return deferred.promise;
      }

      return $q.reject(rejection);
    }
  };
}]);

app.filter('duration2time', function() {
   return function(duration) {
        duration = parseInt(duration);
        if(!angular.isNumber(duration)) duration = 0; 
        var minutes = '0' + Math.floor(duration / 60),
            seconds = '0' + Math.floor(duration) % 60;
        return minutes.substr(-2) + ':' + seconds.substr(-2);
   };
});

app.config(['$routeProvider', '$locationProvider', '$httpProvider',
            function($routeProvider, $locationProvider, $httpProvider) {
  $routeProvider.
    when('/', {
      templateUrl: '/partials/dashboard',
      controller:  'dashboardCtrl'
    }).
    when('/register', {
      templateUrl: '/partials/registration',
      controller:  'registerCtrl'
    }).
    when('/register/activate', {
      templateUrl:   '/partials/tokenValidator',
      controller: 'tokenCtrl'
    }).
    when('/login', {
      templateUrl: '/partials/login',
      controller:  'loginCtrl'
    }).
    when('/forgot', {
      templateUrl: '/partials/forgot',
      controller:  'forgotCtrl'
    }).
    when('/reset', {
      templateUrl: '/partials/passwordReset',
      controller:  'passwordResetCtrl'
    }).
    when('/user/:userId', {
      templateUrl: '/partials/userProfile',
      controller:  'userProfileCtrl',
      access: {
        loginRequired: true
      }
    }).
    when('/user/:userId/edit', {
      templateUrl: '/partials/userProfile',
      controller:  'userProfileCtrl',
      access: {
        loginRequired: true
      } 
    }).
    when('/album/new', {
      templateUrl: '/partials/album',
      controller:  'albumCtrl',
      access: {
        loginRequired: true
      }
    }).
    when('/album/:albumId', {
      templateUrl: '/partials/album',
      controller:  'albumCtrl',
      access: {
        loginRequired: true
      }
    }).
    when('/album/:albumId/edit', {
      templateUrl: '/partials/album',
      controller:  'albumCtrl',
      access: {
        loginRequired: true
      }
    }).
    when('/track/new', {
      templateUrl: '/partials/track',
      controller:  'trackCtrl',
      access: {
        loginRequired: true
      }
    }).
    when('/track/:trackId', {
      templateUrl: '/partials/track',
      controller:  'trackCtrl',
      access: {
        loginRequired: true
      }
    }).
    when('/track/:trackId/edit', {
      templateUrl: '/partials/track',
      controller:  'trackCtrl',
      access: {
        loginRequired: true
      }
    }).
    when('/playlist/new', {
      templateUrl: '/partials/playlist',
      controller:  'playlistCtrl',
      access: {
        loginRequired: true
      }
    }).
    when('/playlist/:playlistId', {
      templateUrl: '/partials/playlist',
      controller:  'playlistCtrl',
      access: {
        loginRequired: true
      }
    }).
    when('/playlist/:playlistId/edit', {
      templateUrl: '/partials/playlist',
      controller:  'playlistCtrl',
      access: {
        loginRequired: true
      }
    }).
    when('/queue', {
      templateUrl: '/partials/queue',
      controller:  'queueCtrl',
      access: {
        loginRequired: true
      }
    }).
    when('/search', {
      templateUrl: '/partials/search',
      controller:  'searchCtrl',
      access: {
        loginRequired: true
      }
    }).
    otherwise({redirectTo: '/'});

  $locationProvider.html5Mode(true);
  $httpProvider.interceptors.push('APIInterceptor');
}])
.run(function($rootScope, $location, $log, AuthenticationSvc, AUTH, MessageSvc, UsersSvc) {
  /*variable to capture user's final destination
    in case of redirection to the /login page
    on protected route requests. */
  var loginRedirectUrl;

  /*Listen to route changes 
    to intercept and inject behaviors. */  
  $rootScope.$on('$routeChangeStart', function(event, next) {
    var authorized;
        
    if(next.originalPath === '/register') {
      loginRedirectUrl = null;
    } else if(!!loginRedirectUrl && next.originalPath !== '/login') {
      $location.path(loginRedirectUrl).replace();
      loginRedirectUrl = null;
    }

    if(!!next.access) {
      authorized = AuthenticationSvc.authorize(next.access.loginRequired);
      
      if(authorized === AUTH.mustLogIn) {
        loginRedirectUrl = $location.url();
        MessageSvc.addMsg('warning', 'You must log-in first to access that resource.');
        $location.path('login'); 
      } else if(authorized === AUTH.notAuthorized) {
        // $location.path(403page);
      }
    }
  });
});

/*__________________________________________

          AUTHENTICATION SERVICES
  __________________________________________*/

app.service('SessionSvc', ['$rootScope', 'AUTH', 'UsersSvc', 'sessionStore',
                          function($rootScope, AUTH, UsersSvc, store) {
  var self        = this;
  var currentUser = null;

  $rootScope.$on(AUTH.loginSuccess, function(events, user) {
    self.setCurrentUser(user);
  });

  $rootScope.$on(AUTH.logoutSuccess, function() {
    self.destroy();
  });

  self.setCurrentUser = function(user) {
    store.setData('currentUser', user);
  };

  self.getCurrentUser = function() {
    currentUser = store.getData('currentUser');
    return currentUser;
  };

  self.destroy = function() {
    self.currentUser = null;
    store.deleteData('currentUser');
    store.deleteData('accessKeys');
  };
}]);
app.service('AuthenticationSvc', ['$rootScope', 'AUTH', 'ROUTES', 'SessionSvc',
  'sessionStore', 'AccessToken', '$log', function($rootScope, AUTH, ROUTES,
  Session, store, AccessToken, $log) {
  var self  = this;

  self.login = function(credentials, success, failure) {
    /*First authenticate the user against server database.*/
    AccessToken.getFor({
      username: credentials.handle,
      password: credentials.password
    }, function(tokens) {
      $rootScope.$broadcast(AUTH.authenticated);
      /*Second, get the metadata of the user who was granted access to API.*/
      AccessToken.getUser({token: tokens.access_token}, function(user) {
        if (!!user.activated) {
          Session.setCurrentUser(user);
          store.setData('accessKeys', tokens);
          $rootScope.$broadcast(AUTH.loginSuccess, user);
          success(user);
        } else {
          $rootScope.$broadcast(AUTH.mustActivateAccount, user);
          failure('mustActivateAccount');
        }
      }, function(err) {
        $rootScope.$broadcast(AUTH.loginFailed);
        failure(err);
      });
    }, function(err) {
      $rootScope.$broadcast(AUTH.notAuthenticated);
      failure(err);
    });
  };

  self.logout = function(callback) {
    var accessKeys    = store.getData('accessKeys');
    var refreshToken  = accessKeys ? accessKeys.refresh_token : null;

    AccessToken.revoke({token_type_hint: 'refresh_token', token: refreshToken}, function() {
      Session.destroy();
      callback(true);
    }, function(err) {
      if (err.error_description === 'invalid token') {
        Session.destroy();
        callback(true);
      }
    });

    callback(false);
  };

  self.isAuthenticated = function() {
    if (Session.getCurrentUser() && Session.getCurrentUser()._id) {
      $rootScope.$broadcast(AUTH.authenticated);
      return true;
    }
    $rootScope.$broadcast(AUTH.notAuthenticated);
    return false;
  };

  self.authorize = function(loginRequired) {
    var result = AUTH.authorized;
    var logged = self.isAuthenticated();

    if (!!loginRequired && !!!logged) {
      result = AUTH.mustLogIn;
    }
    return result;
  };
}]);

/*________________________________________________________

               APP RESOURCE SERVICE WRAPPERS
  ________________________________________________________*/

app.service('UsersSvc', ['Users', 'MessageSvc', '$log', '$location',
'$rootScope', function(Users, MessageSvc, $log, $location, $rootScope) {
  var self = this;
  self.create = function(user, success, failure) {
    var newUser = new Users();
    for (var key in user) {
      newUser[key] = user[key];
    }
    newUser.$save(function(savedUser) {
      success(savedUser);
    }, function(err) {
      failure(err);
    });
  };

  self.delete = function(user, success, failure) {
    Users.delete({id: user._id}, function(data) {
      return success(data);
    }, function(error) {
      return failure(error);
    });
  };

  self.update = function(user, success, failure) {
    Users.get({id: user._id}, function(userToUpdate) {
      for (var key in userToUpdate) {
        if (!!user[key] && (userToUpdate[key] !== user[key])) {
          userToUpdate[key] = user[key];
        }
      }
      if (!!user.avatar) {
        userToUpdate.avatar = user.avatar;
        delete userToUpdate.avatarUrl;
      }
      /* Eventually delete all these 4 following ifs. 
         They are probably not necessary. */
      if (user.facebook) {
        userToUpdate.facebook = user.facebook;
      }

      if (user.bio) {
        userToUpdate.bio = user.bio;
      }

      if (user.twitter) {
        userToUpdate.twitter = user.twitter;
      }

      if (user.website) {
        userToUpdate.website = user.website;
      }

      userToUpdate.$update(function(updatedUser) {
        return success(updatedUser);
      }, function(err) {
        $log.error('Profile update failed: ' + err);
        return failure(err);
      });
    });
  };

  self.get = function(id, success, failure) {
    Users.get({id: id}, function(user) {
      if (!!user.avatarUrl &&
        (user.avatarUrl.search('user-avatar-placeholder') === -1)) {
        user.avatarUrl = '../../' +
          user.avatarUrl.split('/').slice(1).join('/');
      }
      success(user);
    }, function(err) {
      failure(err);
    });
  };

  self.all = Users.query(function(collection) {
    var ret = [];
    angular.forEach(collection, function(item) {
      if (!!item.avatarUrl &&
        (item.avatarUrl.search('user-avatar-placeholder') === -1)) {
        item.avatarUrl = '../../' +
          item.avatarUrl.split('/').slice(1).join('/');
      }
      this.push(item);
    }, ret);
    return ret;
  }, function(err) {
    $log.debug('Unable to get all the users!');
  });

  self.findByHandle = function(handle, success, failure) {
    return Users.find({handle: handle}, function(user) {
      success(user);
    }, function(err) {
      failure(err);
    });
  };
}]);
app.service('AlbumsSvc', ['Albums', '$log', function(Albums, $log) {
  var self = this;

  self.create = function(data, success, failure) {
    var newAlbum = new Albums(
      {
        about:         data.about,
        artistId:      data.artist.id,
        coverArt:      data.coverArt,
        releaseDate:   data.releaseDate,
        title:         data.title
      }
    );
    newAlbum.$save(function(savedAlbum) {
      success(savedAlbum);
    }, function(err) {
      failure(err);
    });
  };

  self.update = function(album, success, failure) {
    Albums.get({id: album._id}, function(albumToUpdate) {
      for (var key in albumToUpdate) {
        if (!!album[key] && (albumToUpdate[key] !== album[key])) {
          albumToUpdate[key] = album[key];
        }
      }
      if (album.coverArt) {
        albumToUpdate.coverArt = album.coverArt;
      }

      albumToUpdate.$update(function(updatedAlbum) {
        success(updatedAlbum);
      }, function(err) {
        failure(err);
      });
    });
  };

  self.get = function(albumId, success, failure) {
    Albums.get({id: albumId}, function(data) {
      data.artist = {id: data.artistId};
      delete data.artistId;
      data.releaseDate = new Date(data.releaseDate);  // AngularJs 1.3+ only accept valid Date format and not string equilavent
      if (!!data.imageUrl &&
        (data.imageUrl.search('album-coverart-placeholder') === -1)) {
        data.imageUrl = '../../' + data.imageUrl.split('/').slice(1).join('/');
      }
      success(data);
    }, function(err) {
      failure(err);
    });
  };

  self.all = Albums.query(function(collection) {
    var ret = [];
    angular.forEach(collection, function(item) {
      item.artist = {id: item.artistId};
      delete item.artistId;
      item.releaseDate = new Date(item.releaseDate);  // AngularJs 1.3+ only accept valid Date format and not string equilavent
      if (!!item.imageUrl &&
        (item.imageUrl.search('album-coverart-placeholder') === -1)) {
        item.imageUrl = '../../' + item.imageUrl.split('/').slice(1).join('/');
      }
      this.push(item);
    }, ret);
    return ret;
  }, function(err) {
    $log.debug('Unable to get all the albums!');
  });

  self.getByUser = function(user, success, failure) {
    Albums.getByUser({userId: user._id}, function(albums) {
      angular.forEach(albums, function(data) {
        data.artist = {id: data.artistId};
        delete data.artistId;
        data.releaseDate = new Date(data.releaseDate);
        if (!!data.imageUrl &&
          (data.imageUrl.search('album-coverart-placeholder') === -1)) {
          data.imageUrl = '../../' +
            data.imageUrl.split('/').slice(1).join('/');
        }
      });
      success(albums);
    }, function(err) {
      failure(err);
    });
  };

  self.delete = function(album, success, failure) {
    Albums.delete({id: album._id}, function(data) {
      success(data);
    }, function(err) {
      failure(err);
    });
  };
}]);
app.service('TracksSvc', ['Tracks', '$log', 'UsersSvc', 'AlbumsSvc', '$window',
'sessionStore', function(Tracks, $log, UsersSvc, AlbumsSvc, $window, store) {
  var self = this;

  self.create = function(track, success, failure) {
    var newTrack = new Tracks({
      about:        track.about,
      albumId:      track.album.id,
      artistId:     track.artist.id,
      audioFile:    track.audioFile,
      coverArt:     track.coverArt,
      downloadable: track.downloadable,
      duration:     track.duration,
      feat:         track.feat,
      genre:        track.genre,
      imageFile:    track.imageFile,
      lyrics:       track.lyrics,
      releaseDate:  track.releaseDate,
      streamUrl:    track.streamUrl,
      title:        track.title
    });

    newTrack.$save(function(savedTrack) {
      success(savedTrack);
    }, function(err) {
      failure(err);
    });
  };

  self.update = function(track, success, failure) {
    Tracks.get({id: track._id}, function(trackToUpdate) {
      for (var key in trackToUpdate) {
        if (!!track[key] && trackToUpdate[key] !== track[key]) {
          trackToUpdate[key] = track[key];
        }
      }
      trackToUpdate.albumId = track.album.id;

      if ('imageFile' in track && track.imageFile) {
        trackToUpdate.imageFile = track.imageFile;
      }

      if ('audioFile' in track && track.audioFile) {
        trackToUpdate.audioFile = track.audioFile;
      }

      trackToUpdate.$update(function(updatedTrack) {
        success(updatedTrack);
      }, function(err) {
        failure(err);
      });
    });
  };

  self.get = function(trackId, success, failure) {
    Tracks.get({id: trackId}, function(data) {
      data.artist      = {id: data.artistId};
      data.album       = {id: data.albumId};
      data.releaseDate = new Date(data.releaseDate); // AngularJs 1.3+ only accept valid Date format and not string equilavent
      delete data.artistId;
      delete data.albumId;
      if (!!data.coverArt &&
        (data.coverArt.search('track-coverart-placeholder') === -1)) {
        data.coverArt = '../../' + data.coverArt.split('/').slice(1).join('/');
      }
      if (!!data.streamUrl) {
        data.streamUrl = '../../' +
          data.streamUrl.split('/').slice(1).join('/');
      }
      success(data);
    }, function(err) {
      failure(err);
    });
  };

  self.latest = function(success, failure) {
    Tracks.query(function(collection) {
      var ret = [];
      angular.forEach(collection, function(item) {
        item.artist      = {id: item.artistId};
        item.album       = {id: item.albumId};
        item.releaseDate = new Date(item.releaseDate); // AngularJs 1.3+ only accept valid Date format and not string equilavent
        delete item.artistId;
        delete item.albumId;
        //
        // The following is taken from the inflate code
        //
        UsersSvc.get(item.artist.id, function(user) {
          item.artist.handle = user.handle;
        }, function(err) {
          $log.error('Error inflating track artist info: ' + err);
        });
        AlbumsSvc.get(item.album.id, function(album) {
          item.album.title  = album.title;
        }, function(err) {
          $log.error('Error inflating track album info: ' + err);
        });
        //
        // End of the inflate code
        // 
        if ('coverArt' in item && !!item.coverArt &&
          (item.coverArt.search('track-coverart-placeholder') === -1)) {
          item.coverArt = '../../' + item.coverArt.split('/').slice(1).join('/');
        }
        if ('streamUrl' in item && !!item.streamUrl) {
          item.streamUrl = '../../' +
            item.streamUrl.split('/').slice(1).join('/');
        }
        this.push(item);
      }, ret);
      success(ret);
    }, function(err) {
      failure('Could query all the tracks!');
    });
  };

  self.find = function(query, success, failure) { // query must be a valid hash with a_id &| u_id
    var search;
    if ('a_id' in query || 'u_id' in query) {
      search = query.a_id ? {resource: 'album', resource_id: query.a_id} : {resource: 'artist', resource_id: params.u_id};
    }
    if (!!search) {
      Tracks.find(search, function(tracks) {
        angular.forEach(tracks, function(track) {
          track.artist      = {id: track.artistId};
          track.album       = {id: track.albumId};
          track.releaseDate = new Date(track.releaseDate);
          if (!!track.coverArt &&
            (track.coverArt.search('track-coverart-placeholder') === -1)) {
            track.coverArt   = '../../' +
              track.coverArt.split('/').slice(1).join('/');
          }
          if (!!track.streamUrl) {
            track.streamUrl = '../../' +
              track.streamUrl.split('/').slice(1).join('/');
          }
        });
        success(tracks);
      }, function(err) {
        failure(err);
      });
    } else {
      failure('invalid find params');
    }
  };

  self.inflate = function(index, container, success, failure) {
    if (!index) {
      return $log.debug('there is no index sent to Tracks.inflate.');
    }
    self.get(index, function(track) {
      UsersSvc.get(track.artist.id, function(user) {
        track.artist.handle = user.handle;
      }, function(err) {
        $log.error('Error inflating track artist info: ' + err);
      });
      AlbumsSvc.get(track.album.id, function(album) {
        track.album.title  = album.title;
      }, function(err) {
        $log.error('Error inflating track album info: ' + err);
      });
      if (!!container) {
        container.push(track);
      }
      success(track);
    }, function(err) {
      failure(err);
    });
  };

  self.downloadLink = function(track, success, failure) {
    var accessKeys  = store.getData('accessKeys');
    var accessToken = accessKeys ? accessKeys.access_token : null;
    var downloadUrl = '/zinfataclient/tracks/' + track._id + '/download';

    if (accessToken) {
      downloadUrl += '?token=' + accessToken;
      $window.open(downloadUrl);
    }
  };

  self.delete = function(track, success, failure) {
    Tracks.delete({id: track._id}, function(data) {
      data.artist      = {id: data.artistId};
      data.album       = {id: data.albumId};
      data.releaseDate = new Date(data.releaseDate); // AngularJs 1.3+ only accept valid Date format and not string equilavent
      delete data.artistId;
      delete data.albumId;
      success(data);
    }, function(err) {
      failure(err);
    });
  };
}]);
app.service('PlaylistsSvc', ['Playlists', '$log', function(Playlists, $log) {
  var self = this;

  self.create = function(playlist, success, failure) {
    var newPlaylist = new Playlists({
      // coverArt:     playlist.coverArt,
      ownerId:      playlist.owner.id,
      title:        playlist.title,
      tracks:       playlist.tracks
    });

    newPlaylist.$save(function(savedPlaylist) {
      return success(savedPlaylist);
    }, function(err) {
      return failure(err);
    });
  };

  self.update = function(playlist, success, failure) {
    Playlists.get({id: playlist._id}, function(playlistToUpdate) {
      for (var key in playlistToUpdate) {
        if (!!playlist[key] && playlistToUpdate[key] !== playlist[key]) {
          playlistToUpdate[key] = playlist[key];
        }
      }
      /*
      if (!!playlist.coverArt) {
          playlistToUpdate.cover_art = playlist.coverArt;
          delete playlistToUpdate.imageUrl;
      }
      */
      playlistToUpdate.$update(function(updatedPlaylist) {
        return success(updatedPlaylist);
      }, function(err) {
        return failure(err);
      });
    });
  };

  self.get = function(playlistId, success, failure) {
    return Playlists.get({id: playlistId}, function(data) {
      data.owner = {id: data.ownerId};
      delete data.ownerId;
      /* 'Public' folder is outside the root path of the AngularJs app but inside ExpressJs static path
      if (!!data.coverArt)   data.coverArt   = '../../' + data.coverArt.split('/').slice(1).join('/');
      */
      success(data);
    }, function(err) {
      failure(err);
    });
  };

  self.all = Playlists.query(function(collection) {
    var ret = [];
    angular.forEach(collection, function(item) {
      item.owner = {id: item.ownerId};
      delete item.ownerId;
      this.push(item);
    }, ret);
    return ret;
  }, function(err) {
    $log.debug('Unable to get all the playlists!');
  });

  self.find = function(query, success, failure) { // params must be a valid hash with a_id &| u_id
    if ('u_id' in query) {
      query.resource    = 'owner';
      query.resource_id = query.u_id;

      delete query.u_id;

      Playlists.find(query, function(playlists) {
        angular.forEach(playlists, function(playlist) {
          playlist.owner = {id: playlist.ownerId};
          delete playlist.ownerId;
          /* 'Public' folder is outside the root path of the AngularJs app but inside ExpressJs static path
          ** if (!!playlist.coverArt)   playlist.coverArt   = '../../' + playlist.coverArt.split('/').slice(1).join('/');
          */
        });
        success(playlists);
      }, function(err) {
        failure(err);
      });
    }
  };

  self.delete = function(playlist, success, failure) {
    Playlists.delete({id: playlist._id}, function(data) {
      data.owner = {id: data.ownerId};
      delete data.ownerId;
      /* 'Public' folder is outside the root path of the AngularJs app but inside ExpressJs static path
      if (!!data.coverArt)   data.coverArt   = '../../' + data.coverArt.split('/').slice(1).join('/');
      */
      success(data);
    }, function(err) {
      failure(err);
    });
  };

  self.addTrack = function(playlist, track, success, failure) {
    Playlists.get({id: playlist._id}, function(playlistToUpdate) {
      playlistToUpdate.tracks.push(track._id);
      playlistToUpdate.$update(function(updatedPlaylist) {
        success(updatedPlaylist);
      }, function(err) {
        failure(false);
      });
    }, function(err) {
      failure(false);
    });
  };

  self.removeTrack = function(playlist, index, success, failure) {
    Playlists.get({id: playlist._id}, function(playlistToUpdate) {
      playlistToUpdate.tracks.splice(index, 1);
      playlistToUpdate.$update(function(updatedPlaylist) {
        success(updatedPlaylist);
      }, function(err) {
        failure(false);
      });
    }, function(err) {
      failure(false);
    });
  };
}]);

/*________________________________________________________

                    APP OTHER SERVICES
  ________________________________________________________*/

app.service('QueueSvc', ['localStore', '$rootScope', 'AUDIO', 'QUEUE', '$log',
'TracksSvc', 'SessionSvc', 'AUTH', function(queue, $rootScope, AUDIO, QUEUE,
$log, TracksSvc, Session, AUTH) {
  var self  = this;
  var owner = function() {
    return Session.getCurrentUser() && Session.getCurrentUser()._id;
  }

  self.playNext       = function() {
    var tracks      = self.getTracks();
    var nowPlaying  = self.getCurrentTrack();
    var queueLength = tracks.length;
    var index       = nowPlaying.index + 1;

    if (index >= queueLength) {
      index = 0;
    }

    self.getTrackAt(index, function(track) {
      self.play(track, index);
    });
  };

  self.playPrev       = function() {
    var tracks       = self.getTracks();
    var queueLength  = tracks.length;
    var currentIndex = self.getCurrentTrack().index;
    var index        = currentIndex - 1;
    if (index < 0) {
      index = queueLength - 1;
    }

    self.getTrackAt(index, function(track) {
      self.play(track, index);
    });
  };

  self.saveQueue       = function(tracks, nowPlaying) {
    if (tracks && Array.isArray(tracks)) {
      queue.setData(owner() + '.queue.tracks', tracks);
    }

    if (!!nowPlaying) {
      queue.setData(owner() + '.queue.nowPlaying', nowPlaying);
    }
  };

  self.clearQueue     = function() {
    self.saveQueue([]);
  };

  self.getCurrentTrack = function() {
    return queue.getData(owner() + '.queue.nowPlaying') || {};
  };

  self.addTrack        = function(track, playNext) {
    var tracks = self.getTracks();
    playNext ? tracks.unshift(track._id) : tracks.push(track._id);
    self.saveQueue(tracks);
  };

  self.getTracks       = function() {
    return queue.getData(owner() + '.queue.tracks') || [];
  };

  self.getTrackAt      = function(index, success, failure) {
    var tracks = self.getTracks();
    if (!!tracks.length) {
      TracksSvc.inflate(tracks[index], null, function(track) {
        success(track);
      }, function(err) {
        failure(err);
      });
    } else {
      failure('No tracks to fetch');
    }
  };

  self.removeTrackAt   = function(index, success, failure) {
    var tracks     = self.getTracks();
    var nowPlaying = self.getCurrentTrack();

    if (!!tracks.splice(index, 1).length) {
      if (nowPlaying.index > index) {
        nowPlaying.index--;
      } else if (nowPlaying.index === index) {
        if (index >= tracks.length) {
          index = 0;
        }
        self.getTrackAt(index, function(track) {
          self.play(track, index);
        }, function() {});
      }
      self.saveQueue(tracks, nowPlaying);
      success(index);
    } else {
      failure('Track removal from queue failed at index: ' + index);
    }
  };
  /* User clicks on a track's playNow button */
  self.playNow = function(track) {
    var newIndex   = 0;
    var queueCue   = 0;
    var nowPlaying = self.getCurrentTrack();
    var tracks     = self.getTracks();

    if (nowPlaying) {
      queueCue = nowPlaying.index;
    }

    /* If there is a queue, stick the track in after
       the current index position */
    if (!!tracks.length && !!Object.keys(nowPlaying).length) {
      tracks.splice(queueCue, 0, track._id);
      newIndex = queueCue++;
    } else if (!!tracks.length && !Object.keys(nowPlaying).length) { //there is no queue, add to end to create.
      self.addTrack(track, true);
    } else {
      self.addTrack(track);
    }
    self.play(track, newIndex);
  };

  self.play = function(track, index) {
    if (!('title' in track.album || 'handle' in track.artist)) {
      track = TracksSvc.inflate(track._id, null, function(inflatedTrack) {
        return inflatedTrack;
      }, function(err) {return;});
    }
    $log.debug(track.artist.handle + ' : ' + track.album.title);
    var nowPlaying = self.getCurrentTrack();
    nowPlaying.index = index;
    nowPlaying.track = track;
    self.saveQueue(null, nowPlaying);
    $rootScope.$broadcast(AUDIO.set, nowPlaying.track);
  };
}]);
app.service('MessageSvc', function() {
  this.message = null;

  this.getMsg = function() {
    return this.message;
  };

  this.addMsg = function(type, text) {
    this.message = {
      type: type,
      text: text
    };
  };

  this.clear = function() {
    this.message = null;
  };
});

dispatch.factory('Credentials', ['$resource', function($resource) {
    return $resource('/creds/:api', {api: '@api'}, {
        soundcloud: { method: 'GET', params: {api: 'soundcloud'} }
    });
}])
.factory('Soundcloud', ['$resource', '$rootScope', 'Credentials', '$log', '$q', 'sessionStore', 
                        function($resource, $rootScope, Creds, $log, $q, store) {
    /*  This factory is absolutely buggy and cannot be considered complete.
        It is probably better to include the JavaScript SDK and allow user to 
        upload to Soundcloud through their own accounts via zinfataClient. */
    var SC     = {},
        SC_api = $resource('https://api.soundcloud.com/:endpoint', {endpoint: '@endpoint'}, {
            connect: { method: 'POST', params: {endpoint: 'oauth2/token'} },
            upload:  { method: 'POST', params: {endpoint: 'tracks'} }
        });
    SC.connect = function(success, failure) {
        Creds.soundcloud(function(credentials) {
            var creds = {
                client_id:     credentials.clientId,
                client_secret: credentials.clientSecret,
                grant_type:    'password',
                username:      credentials.username,
                password:      credentials.password
            };
            
            SC_api.connect(creds, function(response) {
                success(response);
            }, function(err) {
                failure(err);
            });
        });
    };

    SC.upload = function(track) {
        var payload  = {
            title:      track.artist.handle + ' - ' + track.title,
            asset_data: track.audioFile
        };
            /*deferred = $q.defer(),
            url      = 'https://api.soundcloud.com/tracks',
            xhr      = new XMLHttpRequest;

            xhr.upload.onprogress = function(e) {
                if(e.lengthComputable) deferred.notify(Math.round(e.loaded / e.total * 100));
            };

            xhr.upload.onload = function(e) {
                var res = {
                    data:    e.response,
                    status:  e.status,
                    headers: e.getResponseHeader,
                    config:  {}
                };
                $log.debug(res.status);
                if(res.status === 200) {
                    deferred.resolve(res);
                } else {
                    deferred.reject(res);
                }
            };

            xhr.upload.onerror = function(e) {
                deferred.reject(e);
            };

            xhr.onreadystatechange = function() {
                $log.debug(xhr);
                $log.debug(xhr.readyState);
                if(xhr.readyState === 4 && xhr.status === 401) {
                    $log.debug('we intercepted the 401');
                    SC.connect(function(accessToken) {
                        store.setData('SCKeys', accessToken);
                        
                    }, function(err) {
                        deferred.reject();
                    });
                }
            }

            xhr.open('POST', url, true);
            xhr.send(payload);

            return deferred.promise;*/
    };

    return SC;
}]);
app.controller('albumCtrl', ['$scope', '$rootScope', '$location',
'$routeParams', 'SessionSvc', 'TracksSvc', 'QueueSvc', 'AlbumsSvc',
'UsersSvc', 'MessageSvc', 'ALBUM_EVENTS', '$log', function($scope, $rootScope,
$location, $routeParams, Session, Tracks, Queue, AlbumsSvc, Users, MessageSvc,
ALBUM_EVENTS, $log) {
  $scope.album = {
    coverArt:    '',
    imageUrl:    'images/album-coverart-placeholder.png',
    title:       '',
    artist: {
      id:        ''
    },
    about:       '',
    releaseDate: ''
  };
  $scope.editing  = false;
  $scope.creating = false;
  $scope.canEdit  = false;

  $scope.pageTitle = 'Add New Album';
  $scope.pageDescription = 'Quickly upload a new album to Zinfata.';

  if ($location.path() === '/album/new') {
    $scope.creating = true;
  }

  if ($routeParams.albumId) {
    AlbumsSvc.get($routeParams.albumId, function(data) {
      $scope.album             = data;
      $scope.album.duration    = 0;
      $scope.album.trackLength = 0;
      var duration             = 0;

      if (!!$scope.album.artist.id &&
      ($scope.album.artist.id === Session.getCurrentUser()._id)) {
        $scope.canEdit = true;
      }
      if ($location.path() === '/album/' + $routeParams.albumId + '/edit') {
        $scope.canEdit ? $scope.editing = true : $location.path('album/' +
          $routeParams.albumId);
        if ($scope.editing) {
          $scope.pageTitle = 'Edit Album Info';
          $scope.pageDescription = 'Edit this album basic information.';
        }
      }
      Users.get($scope.album.artist.id, function(user) {
        $scope.album.artist.handle    = user.handle;
        $scope.album.artist.avatarUrl = user.avatarUrl;
      }, function(err) {
        $scope.album.artist = 'Unknown';
      });

      Tracks.find({a_id: data._id} , function(tracks) {
        angular.forEach(tracks, function(track) {
          $scope.album.trackLength++;
          duration = parseInt(track.duration);
          if (angular.isNumber(duration)) {
            $scope.album.duration += duration;
          }
        });
      }, function(err) {});
    }, function(err) {
      $location.path('/');
    });
  }

  $scope.edit = function(album) {
    $location.path('/album/' + album._id + '/edit');
  };

  $scope.queueUp = function(album) {
    // Queue.addAlbum
  };

  $scope.play = function(album) {
    // Queue.addAlbum(album, playNow)
  };

  $scope.create = function(album) {
    if (!album.artist.id) {
      album.artist.id = Session.getCurrentUser()._id;
    }

    AlbumsSvc.create(album, function(createdAlbum) {
      $rootScope.$broadcast(ALBUM_EVENTS.createSuccess);
      MessageSvc.addMsg('success',
        'You have successfully added a new album!');
      $location.path('album/' + createdAlbum._id);
    }, function(err) {
      $rootScope.$broadcast(ALBUM_EVENTS.createFailed);
      MessageSvc.addMsg('danger',
        'Something went wrong trying to create your album!');
    });
  };

  $scope.update = function(album) {
    if ($scope.album.duration) {
      delete $scope.album.duration;
    }

    if ($scope.album.trackLength) {
      delete $scope.album.trackLength;
    }

    if (!album.artist.id) {
      album.artist.id = Session.getCurrentUser()._id;
    }

    AlbumsSvc.update(album, function(updatedAlbum) {
      $rootScope.$broadcast(ALBUM_EVENTS.updateSuccess);
      MessageSvc.addMsg('success',
        'You have successfully updated the album info');
      $scope.editing = false;
      $location.path('album/' + updatedAlbum._id);
    }, function(err) {
      $rootScope.$broadcast(ALBUM_EVENTS.updateFailed);
      MessageSvc.addMsg('danger',
        'Something went wrong trying to update your album!');
    });
  };

  $scope.delete = function(album) {
    AlbumsSvc.delete(album, function() {
      MessageSvc.addMsg('success',
        'The album has been successfully deleted!');
      $rootScope.$broadcast(ALBUM_EVENTS.deleteSuccess);
      $location.path('/user/' + album.artist.id);
    }, function(err) {
      MessageSvc.addMsg('danger',
        'A problem prevented the deletion of your album. Try again later');
      $rootScope.$broadcast(ALBUM_EVENTS.deleteFailed);
    });
  };

  $scope.updateCoverImage = function(image) {
    $scope.album.coverArt = image.file;
    $scope.album.imageUrl = image.url;
  };
}]);

app.controller('dashboardCtrl', ['$scope', 'TracksSvc', 'SessionSvc', '$log',
'QueueSvc', function($scope, Tracks, Session, $log, Queue) {
  $scope.tracks = [];
  $scope.loggedIn = function() {
    return !!Session.getCurrentUser();
  };
  Tracks.latest(function(tracks) {
    $scope.tracks = tracks;
  }, function(err) {
    $log.debug(err);
  });

  $scope.play = function(track) {
    Queue.playNow(track);
  };

  $scope.addToQueue = function(track) {
    Queue.addTrack(track);
  };
}]);

app.controller('forgotCtrl', ['$scope', '$rootScope', '$location',
'MessageSvc', 'Users', 'PWD_TOKEN', function($scope, $rootScope,
$location, MessageSvc, Users, PWD_TOKEN) {
  $scope.email = '';
  $scope.reset = function(email) {
    Users.resetPassword({email: email}, function(res) {
      $rootScope.$broadcast('PWD_TOKEN.sendSuccess');
      MessageSvc.addMsg('success', 'An email has been sent to you with' +
        'instructions on how to reset your password');
      $scope.email = '';
    }, function(err) {
      $rootScope.$broadcast('PWD_TOKEN.sendFailed');
      MessageSvc.addMsg('danger', 'Something went wrong when trying to' +
        'verify your email. Try again later!');
    });
  };
}]);

app.controller('loginCtrl', ['$scope', '$rootScope', 'AUTH',
'AuthenticationSvc', 'MessageSvc', '$location', '$log', function($scope,
$rootScope, AUTH, AuthSvc, MessageSvc, $location, $log) {
  $scope.credentials = {
    handle:   '',
    password: ''
  };

  $scope.authenticate = function(credentials) {
    /*Authenticate the user with the server.
      returns access token. */
    AuthSvc.login(credentials, function(user) {
      MessageSvc.addMsg('success', 'You are now logged in as ' + user.handle);
      $scope.credentials = {};
      $scope.loginForm.$setPristine();
      $location.path('dashboard');
    }, function(err) {
      var message;
      if (err === 'mustActivateAccount') {
        message = 'You must activate your account to access all the music.' +
          'Check the email we sent you for the activation link.' +
          'Or enter your email address below to have us send you' +
          ' a new validation link.';
        $location.path('register/activate');
      } else {
        message = 'Login failed! Try again later.';
        $location.path('login');
      }
      MessageSvc.addMsg('danger', message);
    });
  };
}]);

app.controller('logoutCtrl', ['$rootScope', '$log', 'MessageSvc', 'UsersSvc', 'AUTH',
                              function($rootScope, $log, MessageSvc, UsersSvc, AUTH) {
  Auth.logout(function() {
    UsersSvc.setCurrentUser({});
    $rootScope.$broadcast(AUTH.logoutSuccess);
    MessageSvc.addMsg('success', 'You have been successfully logged out!');
  }, function(err) {
    MessageSvc.addMsg('danger', 'We couldn\'t log you out. Try again later!');
  });
}]);

app.controller('passwordResetCtrl', ['$scope', '$log', '$rootScope', 'UsersSvc', 'Users', '$location', 'MessageSvc', 'USER_EVENTS', 'PWD_TOKEN', '$routeParams',
                                     function($scope, $log, $rootScope, UsersSvc, Users, $location, MessageSvc, USER_EVENTS, PWD_TOKEN, $routeParams) {
    $scope.credentials = {
      password: '',
      passwordConfirmation: '',
      token: ''
    };
    $scope.validated = false;

    $scope.verify = function(token) {
        Users.verifyToken({token: token}, function(res) {
            $rootScope.$broadcast(PWD_TOKEN.verificationSuccess);
            $scope.validated = true;
        }, function(err) {
            $rootScope.$broadcast(PWD_TOKEN.verificationFailed);
            MessageSvc.addMsg('danger', 'The verification token is either invalid or expired. Request a new one!');
        });
    };

    $scope.update = function(credentials) {
      if(!!credentials.token && credentials.password === credentials.passwordConfirmation) {
        Users.verifyToken({token: credentials.token, get_user: true }, function(res) {
          UsersSvc.update({password: credentials.password, _id: res.userId}, function(res) {
            $log.debug(angular.toJson(res));
            $rootScope.$broadcast(USER_EVENTS.updateSuccess);
            MessageSvc.addMsg('success', 'Password successfully updated. Log in now');
            $location.path('login');
          }, function(err) {
            $rootScope.$broadcast(USER_EVENTS.updateFailed);
            MessageSvc.addMsg('danger', 'Something went wrong when trying to update your password!')
          });
        });
      }
    };

    if($routeParams.token) {
      $scope.credentials.token = $routeParams.token;
      $scope.verify($scope.credentials.token);
    }
}]);

app.controller('playlistCtrl', ['$scope', '$rootScope', '$location', '$log',
'$routeParams', 'AlbumsSvc', 'TracksSvc', 'UsersSvc', 'SessionSvc',
'PlaylistsSvc', 'MessageSvc', 'QueueSvc' ,'PLAYLIST_EVENTS', function($scope,
$rootScope, $location, $log, $routeParams, AlbumsSvc, TracksSvc, UsersSvc,
Session, PlaylistsSvc, MessageSvc, QueueSvc, PLAYLIST_EVENTS) {

  $scope.playlist = {
    title:    '',
    owner:   {
      id:   '',
      handle: ''
    },
    tracks:  []
  };
  $scope.playlistTracks = []; // array of inflated track metadata objects
  $scope.canEdit        = false;
  $scope.creating       = false;
  $scope.editing        = false;

  $scope.pageTitle       = 'Add New Playlist';
  $scope.pageDescription = 'Find and share your favorite tracks easily.';

  if ($location.path() === '/playlist/new') {
    $scope.creating = true;
  }

  if (!!$routeParams.playlistId) {
    PlaylistsSvc.get($routeParams.playlistId, function(data) {
      data.duration = 0;
      if (!!data.owner.id && (data.owner.id === Session.getCurrentUser()._id)) {
        $scope.canEdit = true;
      }

      if ($location.path() === '/playlist/' + $routeParams.playlistId +
        '/edit') {
        $scope.canEdit ? $scope.editing = true : $location.path('/playlist/' +
          $routeParams.playlistId);
        if ($scope.editing) {
          $scope.pageDescription = 'Change this playlist\'s information';
          $scope.pageTitle       = 'Update Playlist';
        }
      }

      /* Populate with owner's data */
      UsersSvc.get(data.owner.id, function(owner) {
        data.owner.handle = owner.handle;
      }, function(err) {
        $log.error('Error getting playlist owner info: ' + err);
      });

      /* If there are tracks, be sure to inflate
      ** each track with album and artist info. */
      if (!!data.tracks.length) {
        var duration = 0;
        angular.forEach(data.tracks, function(trackId, index) {
          if (typeof trackId === 'string') {
            TracksSvc.inflate(trackId, $scope.playlistTracks, function(track) {
              duration = parseInt(track.duration);
              if (!angular.isNumber(duration)) {
                duration = 0;
              }
              data.duration += duration;
            }, function(err) {});
          }
        });
      }

      // Only assign the metadata to the scope playlist at the very end!
      $scope.playlist = data;
      // $scope.playlistTracks = data.tracks;
    }, function(err) {
      $location.path('/');
    });
  }

  $scope.edit = function() {
    $location.path('/playlist/' + $scope.playlist._id + '/edit');
  };

  $scope.removeTrack = function(index) {
    PlaylistsSvc.removeTrack($scope.playlist, index, function(updatedPlaylist) {
      $scope.playlistTracks.splice(index, 1);
    }, function(err) {
      $rootScope.$broadcast(PLAYLIST_EVENTS.updateFailed);
    });
  };

  $scope.play = function(track) {
    QueueSvc.playNow(track);
  };

  $scope.addToQueue = function(track) {
    QueueSvc.addTrack(track);
  };

  $scope.create = function(playlist) {
    playlist.owner.id = Session.getCurrentUser()._id;
    PlaylistsSvc.create(playlist, function(createdPlaylist) {
      $rootScope.$broadcast(PLAYLIST_EVENTS.createSuccess);
      MessageSvc.addMsg('success',
        'You have successfully added a new playlist!');
      $location.path('playlist/' + createdPlaylist._id);
    }, function(err) {
      $rootScope.$broadcast(PLAYLIST_EVENTS.createFailed);
      MessageSvc.addMsg('danger',
        'Something went wrong trying to add your new playlist!');
    });
  };

  $scope.update = function(playlist) {
    PlaylistsSvc.update(playlist, function(updatedPlaylist) {
      $rootScope.$broadcast(PLAYLIST_EVENTS.updateSuccess);
      MessageSvc.addMsg('success',
        'You have successfully updated this playlist!');
      $location.path('playlist/' + updatedPlaylist._id);
    }, function(err) {
      $rootScope.$broadcast(PLAYLIST_EVENTS.updateFailed);
      MessageSvc.addMsg('danger',
        'Something went wrong trying to update your playlist!');
    });
  };

  $scope.delete = function(playlist) {
    PlaylistsSvc.delete(playlist, function(deletedPlaylist) {
      $rootScope.$broadcast(PLAYLIST_EVENTS.deleteSuccess);
      MessageSvc.addMsg('success',
        'You have successfully deleted the playlist!');
      $location.path('/');
    }, function(err) {
      $rootScope.$broadcast(PLAYLIST_EVENTS.deleteFailed);
      MessageSvc.addMsg('danger',
        'Something went wrong trying to delete your playlist!');
    });
  };
}]);

app.controller('queueCtrl', ['$scope', '$rootScope', '$log', 'QueueSvc',
'TracksSvc', 'UsersSvc', 'AlbumsSvc', 'AUDIO', function($scope, $rootScope,
$log, QueueSvc, TracksSvc, UsersSvc, AlbumsSvc, AUDIO) {
  var trackIndexes     = QueueSvc.getTracks();
  var duration         = 0;
  $scope.queueTracks   = [];
  $scope.nowLoaded     = QueueSvc.getCurrentTrack() &&
                         QueueSvc.getCurrentTrack().index;
  $scope.queueDuration = 0;

  /* If there are tracks, be sure to inflate
  ** each track with album and artist info.*/
  if (!!trackIndexes.length) {
    angular.forEach(trackIndexes, function(trackId, index) {
      if (typeof trackId === 'string') {
        TracksSvc.inflate(trackId, this, function(track) {
          duration = parseInt(track.duration);
          if (!angular.isNumber(duration)) {
            duration = 0;
          }
          $scope.queueDuration += duration;
        }, function(err) {});
      }
    }, $scope.queueTracks);
  }

  $scope.$on(AUDIO.set, function() {
    $scope.nowLoaded = QueueSvc.getCurrentTrack() &&
                       QueueSvc.getCurrentTrack().index;
  });

  $scope.$watch(function() {
    return $scope.queueTracks.length;
  }, function(newVal, oldVal) {
    if (newVal !== oldVal) {
      $scope.queueDuration = 0;
      angular.forEach($scope.queueTracks, function(track) {
        duration = parseInt(track.duration);
        if (!angular.isNumber(duration)) {
          duration = 0;
        }
        $scope.queueDuration += duration;
      });
    }
  });

  $scope.playPause   = function(event, index) {
    event.preventDefault();

    if ($scope.nowLoaded === index) {
      $rootScope.$broadcast(AUDIO.playPause);
    } else {
      QueueSvc.play($scope.queueTracks[index], index);
      $scope.nowLoaded = index;
    }
  };

  $scope.removeTrack = function(index) {
    QueueSvc.removeTrackAt(index, function() {
      $scope.queueTracks.splice(index, 1);
      if ($scope.nowLoaded >= index) {
        $scope.nowLoaded = QueueSvc.getCurrentTrack() &&
                           QueueSvc.getCurrentTrack().index;
      }
    }, function(err) {
      $log.error(err);
    });
  };
}]);

app.controller('registerCtrl', ['$scope', 'UsersSvc', 'MessageSvc',
'$location', function($scope, UsersSvc, MessageSvc, $location) {
  $scope.user     = {
    firstName: '',
    lastName:  '',
    handle:    '',
    email:     '',
    password:  ''
  };

  $scope.register = function() {
    UsersSvc.create($scope.user, function(savedUser) {
      MessageSvc.addMsg('success', 'Welcome to Zinfata, ' +
        savedUser.firstName +
        '. Check the email we sent you to activate your account');
      $scope.user = {};
      $scope.registerForm.$setPristine();
    }, function(err) {
      MessageSvc.addMsg('danger', 'Oops, we were unable to register you!');
    });
  };
}]);

app.controller('searchCtrl', ['$routeParams', function(params) {
    if('q' in params) scope.searchTerm = params.q; 
}]);
app.controller('tokenCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'Users', 'MessageSvc', 'PWD_TOKEN', 'USER_EVENTS',
                            function($scope, $rootScope, $routeParams, $location, Users, MessageSvc, PWD_TOKEN, USER_EVENTS) {
    
    var token = $routeParams.token;
    $scope.email = '';

    if(!!token){
        Users.verifyToken({token: token}, function(res) {
            $rootScope.$broadcast(USER_EVENTS.accountActivated);
            MessageSvc.addMsg('success', 'Account successfully activated. Log in now to access all the music!');
            $location.path('login');
        }, function(err) {
            $rootScope.$broadcast(PWD_TOKEN.verificationFailed);
            MessageSvc.addMsg('danger', 'That activation link is no longer valid. Please, request a new one!');
        });
    }

    $scope.activate = function(email) {
        Users.activate({ email: email }, function(res) {
            $rootScope.$broadcast(PWD_TOKEN.sendSuccess);
            MessageSvc.addMsg('success', 'Great. We just sent you a new email with the link to activate your account!');
        }, function(err) {
            $rootScope.$broadcast(PWD_TOKEN.sendFailed);
            MessageSvc.addMsg('danger', 'We couldn\'t send you a new email at the moment. Try again later.');
        });
    };
}]);

app.controller('trackCtrl', ['$scope', '$sce', '$rootScope', '$location',
  '$routeParams', '$log', 'UsersSvc', 'SessionSvc', 'TracksSvc',
  'PlaylistsSvc', 'TRACK_EVENTS', 'AlbumsSvc', 'ALBUM_EVENTS', 'MessageSvc',
  'QueueSvc', function($scope, $sce, $rootScope, $location, $routeParams, $log,
  UsersSvc, Session, TracksSvc, PlaylistsSvc, TRACK_EVENTS, AlbumsSvc, ALBUM,
  MessageSvc, QueueSvc) {
  var userAddedFile  = '';
  var coverArts      = {};
  var releaseDates   = {};
  var getUserAlbums  = function(id) {
    AlbumsSvc.getByUser({_id: id}, function(data) {
      if (!data.length) {return;}

      /* When creating a new track. Default assign to first album */
      if (!$scope.track.album.id) {
        $scope.track.album.title       = data[0].title;
        $scope.track.album.releaseDate = data[0].releaseDate;
        $scope.track.album.id          = data[0]._id;
        $scope.track.coverArt          = data[0].imageUrl;
      }

      angular.forEach(data, function(album) {
        coverArts[album._id]      = album.imageUrl;
        releaseDates[album._id]   = album.releaseDate;
        if (album._id === $scope.track.album.id) {
          $scope.track.album.title       = album.title;
          $scope.track.album.releaseDate = album.releaseDate;
          if ($scope.track.coverArt !== album.imageUrl) {
            $scope.cover.unique = true;
            /* Save the original unique cover art in case we need to revert back to it
               when the user unchecks 'cover.unique' without uploading new cover afterwards */
            userAddedFile       = $scope.track.coverArt;
          }
        }
      });
      $scope.albums = data;
    }, function(err) {
      $log.error('Error fetching albums for artist: ' +
        $scope.track.artist.id);
    });
  };

  $scope.musicGenres = [
    'alternative', 'blues', 'danse', 'hip hop', 'rap','r&b', 'soul', 'jazz',
    'gospel', 'reggae', 'rock', 'dubstep', 'trap', 'instrumental', 'salsa',
    'flamenco', 'reggaeton', 'meditation', 'funk', 'dancehall', 'a cappella',
    'afro-beat', 'calypso', 'coupe-decale', 'worldbeat'
  ];

  $scope.track = {
    title:       '',
    about:       '',
    lyrics:      '',
    album:  {
      id:      null,
      title:   '',
      coverArt: ''
    },
    artist: {
      id:      null,
      handle:  ''
    },
    streamUrl:   '',
    coverArt:    'images/track-coverart-placeholder.png',
    duration:    '',
    releaseDate: '',
    genre:       '',
    downloadable: false
  };

  $scope.cover = {
    unique:    false
  };

  $scope.albums = [];
  $scope.creating = $scope.editing = false;
  $scope.pageTitle = 'Add New Track';
  $scope.pageDescription = 'Upload a new song for the world to enjoy.';

  if ($location.path() === '/track/new') {
    $scope.creating = true;
  }

  if ($routeParams.trackId) {
    TracksSvc.get($routeParams.trackId, function(data) {
      $scope.track            = data;
      $scope.track.streamUrl  = $sce.trustAsResourceUrl(data.streamUrl);

      if (!!$scope.track.artist.id &&
        ($scope.track.artist.id === Session.getCurrentUser()._id)) {
        $scope.canEdit = true;
      }

      if ($location.path() === '/track/' + $routeParams.trackId + '/edit') {
        $scope.canEdit ? $scope.editing = true : $location.path('track/' +
        $routeParams.trackId);
        if ($scope.editing) {
          $scope.pageDescription = 'Edit this track\'s information';
          $scope.pageTitle = 'Edit Track Information';
        }
      }

      /*
      ** Get the albums pertaining to the track's artist
      ** And update all information relative to current track's album
      */
      getUserAlbums($scope.track.artist.id);

      UsersSvc.get($scope.track.artist.id, function(artist) {
        $scope.track.artist.handle    = artist.handle;
      }, function(err) {
        $log.error('could not fetch track artist: ' +
          $scope.track.artist.id);
      });
    }, function(err) {
      $location.path('/');
    });
  }

  /*
  ** Populate $scope.albums with the current user's albums
  ** when available only when adding a new track.
  ** Otherwise use get the albums by track's artist id
  */
  if ($scope.creating) {
    getUserAlbums(Session.getCurrentUser()._id);
    if ($scope.track.coverArt.search('track-coverart-placeholder') !== -1) {
      $scope.cover.unique = true;
    }
  }
  /*
  ** Watch $scope.track.album.id to update the coverArt dynamically whenever the album selected changes
  */
  $scope.$watch(function() {
    return $scope.track.album.id;
  }, function(newValue, oldValue) {
    if (newValue !== oldValue) {
      if (!$scope.cover.unique && !!coverArts[newValue]) {
        $scope.track.coverArt = coverArts[newValue];
      }
      $scope.track.album.releaseDate = releaseDates[newValue];
      if (!!!$scope.track.releaseDate ||
        ($scope.track.album.releaseDate < $scope.track.releaseDate)) {
        $scope.track.releaseDate = $scope.track.album.releaseDate;
      }
    }
  });

  $scope.$watch(function() {
    return $scope.track.streamUrl;
  }, function(newValue, oldValue) {
    // if (newValue !== oldValue) {
      var audio = new Audio(newValue);
      audio.onloadedmetadata = function() {
        $scope.track.duration = audio.duration;
      };
    // }
  });

  $scope.$watch(function() {
    return $scope.track.coverArt;
  }, function(newValue) {
    if (newValue.search('album-coverart-placeholder') !== -1) {
      $scope.track.coverArt = newValue.replace('album', 'track');
    }
  });

  $scope.$on(ALBUM.createSuccess, function(event, album) {
    $scope.albums.push(album);
    if (!$scope.track.album.id) {
      releaseDates[album._id]        = new Date(album.releaseDate);
      $scope.track.album.id          = album._id;
      $scope.track.album.title       = album.title;
    }
  });

  $scope.readFile = function(elem) {
    var file    = elem.files[0];
    var reader  = new FileReader();
    reader.onload = function() {
      $scope.$apply(function() {
        /*if (elem.name === 'avatar') {
            $scope.track.imageFile  = file;
            $scope.track.coverArt   = userAddedFile = reader.result;
        }*/
        // Reading large mp3 files causes the browser to crash.
        if (elem.name === 'music') {
          $scope.track.audioFile  = file;
          $scope.track.streamUrl  = $sce.trustAsResourceUrl(reader.result);
        }
      });
    };
    reader.readAsDataURL(file);
  };

  /* This function is a workaround for readFile()
  ** to upload files that are too big to read
  */
  $scope.getFile = function(elem) {
    $scope.track.audioFile = elem.files[0];
  };

  $scope.addToPlaylist = function(playlist) {
    PlaylistsSvc.addTrack(playlist, $scope.track);
  };

  $scope.play = function(track) {
    QueueSvc.playNow(track);
  };

  $scope.addToQueue = function(track) {
    QueueSvc.addTrack(track);
  };

  $scope.create = function(track) {
    track.artist.id = Session.getCurrentUser()._id;
    delete track.streamUrl;
    TracksSvc.create(track, function(createdTrack) {
      $rootScope.$broadcast(TRACK_EVENTS.createSuccess, createdTrack);
      MessageSvc.addMsg('success',
        'You have successfully added a new track!');
      $location.path('track/' + createdTrack._id);
    }, function(err) {
      $rootScope.$broadcast(TRACK_EVENTS.createFailed, err);
      MessageSvc.addMsg('danger',
        'Something went wrong trying to upload your new track!');
    });
  };

  $scope.update = function(track) {
    delete track.streamUrl;
    TracksSvc.update(track, function(updatedTrack) {
      $rootScope.$broadcast(TRACK_EVENTS.updateSuccess, updatedTrack);
      MessageSvc.addMsg('success',
        'You have successfully updated this track!');
      $location.path('track/' + updatedTrack._id);
    }, function(err) {
      $rootScope.$broadcast(TRACK_EVENTS.updateFailed, err);
      MessageSvc.addMsg('danger',
        'Something went wrong trying to update your track\'s info!');
    });
  };

  $scope.delete = function(track) {
    TracksSvc.delete(track, function(deletedTrack) {
      $rootScope.$broadcast(TRACK_EVENTS.deleteSuccess);
      MessageSvc.addMsg('success',
        'You have successfully deleted the track!');
      $location.path('/album/' + deletedTrack.album.id);
    }, function(err) {
      $rootScope.$broadcast(TRACK_EVENTS.deleteFailed);
      MessageSvc.addMsg('danger',
        'Something went wrong trying to delete your track!');
    });
  };

  $scope.updateCoverArt = function(unique) {
    if (!unique) {
      $scope.track.coverArt = coverArts[$scope.track.album.id];
    } else {
      $scope.track.coverArt = userAddedFile;
    }
  };

  $scope.updateCoverImage = function(image) {
    $scope.track.imageFile = image.file;
    $scope.track.coverArt  = userAddedFile = image.url;
  };

  $scope.download = function(track) {
    TracksSvc.downloadLink(track, function(downloadUrl) {
      $rootScope.$broadcast(TRACK_EVENTS.downloadSuccess);
    }, function() {
      $rootScope.$broadcast(TRACK_EVENTS.downloadFailed);
      MessageSvc.addMsg('danger', 'Download failed!');
    });
  };

  $scope.edit = function() {
    $location.path('/track/' + $scope.track._id + '/edit');
  };
}]);

app.controller('userProfileCtrl', ['$scope', '$rootScope', 'UsersSvc',
'AlbumsSvc', 'MessageSvc', 'USER_EVENTS', '$routeParams', '$log', '$location',
'SessionSvc', function($scope, $rootScope, UsersSvc, AlbumsSvc, MessageSvc,
USER_EVENTS, $routeParams, $log, $location, Session) {
  var userId = $routeParams.userId ||
    Session.getCurrentUser() && Sesion.getCurrentUser()._id ||
    null;

  $scope.fbRegex = /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:(?:\w)*#!\/)?(?:pages\/)?(?:[\w\-]*\/)*([\w\-]*)/;

  $scope.user         = {};
  $scope.editing      = false;
  $scope.canEdit      = false;

  UsersSvc.get(userId, function(user) {
    $scope.user = user;
    if (Session.getCurrentUser()._id === $scope.user._id) {
      $scope.canEdit = true;
    }
    if (($location.path() === '/user/' + userId + '/edit') && $scope.canEdit) {
      $scope.editing = true;
    }
  }, function(err) {
    $location.path('/');
  });

  $scope.fullname = function(user) {
    return user.firstName + ' ' + user.lastName;
  };

  /* $scope.canEdit = function() {
      return Session.getCurrentUser()._id === $scope.user._id;
  };*/

  $scope.edit    = function() {
    $location.path('/user/' + $scope.user._id + '/edit');
  };

  $scope.update = function(user) {
    UsersSvc.update(user, function(updatedUser) {
      MessageSvc.addMsg('success', 'Your profile has been updated!');
      $rootScope.$broadcast(USER_EVENTS.updateSuccess);
      $scope.editing = false;
      $location.path('/user/' + $scope.user._id);
    }, function(err) {
      MessageSvc.addMsg('danger', 'Profile update unsuccessful!');
      $rootScope.$broadcast(USER_EVENTS.updateFailed);
    });
  };

  $scope.delete = function(user) {
    UsersSvc.delete(user, function(deletedUser) {
      MessageSvc.addMsg('success', 'Your account has been deleted!');
      $rootScope.$broadcast(USER_EVENTS.deleteSuccess, deletedUser);
    }, function(err) {
      MessageSvc.addMsg('danger',
        'A problem prevented your account deletion. Try again later');
      $rootScope.$broadcast(USER_EVENTS.deleteFailed);
    });
  };

  $scope.updateAvatar = function(image) {
    $scope.user.avatar    = image.file;
    $scope.user.avatarUrl = image.url;
  };
}]);

app.controller('headerCtrl', ['$scope', '$rootScope', 'AUTH', 'SessionSvc',
  'MessageSvc', 'AuthenticationSvc', '$location', '$log', 'USER_EVENTS',
  function($scope, $rootScope, AUTH, Session, MessageSvc, Auth, $location,
  $log, USER) {

  $scope.loggedIn = Auth.isAuthenticated;
  $scope.user     = Session.getCurrentUser();

  $scope.$watch(function() {
    return Auth.isAuthenticated();
  }, function(newVal, oldVal) {
    if (newVal !== oldVal) {
      refresh();
    }
  });

  $scope.$on(USER.deleteSuccess, function() {
    $scope.logout();
  });

  $scope.userProfile = function(user) {
    var uri  = '#';

    if (!!user && '_id' in user && user._id) {
      uri = 'user/' + user._id;
    }
    return uri;
  };

  $scope.userSettings = function(user) {
    return '#';
  };

  $scope.logout = function() {
    Auth.logout(function(res) {
      if (res) {
        MessageSvc.addMsg('success', 'You have been successfully logged out!');
        $rootScope.$broadcast(AUTH.logoutSuccess);
      } else {
        MessageSvc.addMsg('danger', 'Issue with the logout process!');
        Session.destroy();
        $rootScope.$broadcast(AUTH.logoutFailed);
      }
      $location.path('/login');
    });
  };

  function refresh() {
    if ($scope.loggedIn) {
      $scope.user = Session.getCurrentUser();
    }
  }
}]);

app.controller('messageCtrl', ['$scope', 'MessageSvc', '$log', '$timeout',
function($scope, MessageSvc, $log, timeout) {
  var e = angular.element('.alert-dismissable');
  $scope.icon    = function() {
    return ($scope.message().type === 'success') ?
        'fa fa-check' : 'fa fa-exclamation';
  };
  $scope.$watch(function() {
    return MessageSvc.getMsg();
  },function(newVal, oldVal) {
    e.show();
    $scope.message = newVal;
    $scope.icon = ($scope.message && $scope.message.type === 'success') ?
    'fa fa-check' : 'fa fa-exclamation';
    timeout(function() {
      e.alert('close');
    }, 3000);
  });

  /*Must prevent Bootstrap from destroying the alert to be reused */
  e.on('close.bs.alert', function() {
    e.hide();
    return false; // prevents element from DOM removal
  });
}]);

app.controller('playerCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
    $scope.track = {};

    $scope.$on('AUDIO.set', function(track) {
        
    });
}]);

app.controller('sidebarCtrl', ['$scope', '$log', 'AuthenticationSvc', 'PlaylistsSvc', 'SessionSvc', 'AUTH',
                                function($scope, $log, AuthenticationSvc, PlaylistsSvc, Session, AUTH) {
    var currentUser  = Session.getCurrentUser();
    $scope.isloggedIn = AuthenticationSvc.isAuthenticated;
}]);
