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
           'AuthenticationSvc', 'AUTH', 'MessageSvc', '$window',
  function($rootScope, QueueSvc, QUEUE, AUDIO, $log, Auth, AUTH, MessageSvc,
    $window) {
  return {
    restrict: 'E',
    link: function(scope, elm) {
      var sound;

      function toSeconds(milliseconds) {
        return milliseconds / 1000;
      };

      function playing() {
        scope.isPlaying = true;
      };

      function playPause() {
        if (!sound) {
          sound = loadTrack(scope.track, true);
        }
        sound.paused ? sound.play() : sound.pause();
      };

      function next() {
        QueueSvc.playNext();
      };

      function prev() {
        QueueSvc.playPrev();
      };

      function stopped() {
        scope.isPlaying = false;
      };

      function loadTrack(track, autoPlay) {
        return soundManager.createSound({
          id: 'sound_' + track._id,
          url: track.url,
          multiShot: false,
          stream: true,
          autoLoad: true,
          onload: function(ok) {
            scope.sound.duration = toSeconds(this.duration);
            scope.$apply();

            if (autoPlay) {
              this.play();
            }
          },
          whileplaying: function() {
            scope.sound.position = toSeconds(this.position);
            scope.$apply();
          },
          onplay: playing,
          onresume: playing,
          onpause: stopped,
          onstop: stopped
        });
      };

      scope.sound = {
        position: 0,
        duration: 0
      };

      scope.isPlaying = false;
      scope.playPause = playPause;
      scope.prev      = prev;
      scope.next      = next;

      /* Initialize the Sound Manager API */
      soundManager.setup({
        url: '/lib/sound-manager-2/swf/',
        flashVersion: 9
      });

      soundManager.onready(function() {
        /* Here is where SM2 does its magic */
      });

      soundManager.ontimeout(function() {
        /* Things went terribly wrong */
      });

      /*if (!Auth.isAuthenticated() || !scope.track || !scope.track.streamUrl) {
        elm.hide();
      }*/
      /*scope.$watch(function() {
        return Auth.isAuthenticated() && (scope.track && !!scope.track.streamUrl);
      }, function(newVal, oldVal) {
        if (!!newVal) {
          elm.show();
        } else {
          elm.hide();
        }
      });*/

      // scope.playing = false;
      // scope.currentTime = 0;
      scope.isLoggedIn = Auth.isAuthenticated;
      // var expander = document.getElementById('expand-player-controllers');
      // var compresser = document.getElementById('compress-player-controllers');
      // var zplayerBottom = document.getElementById('z-player-bottom');

      // window.addEventListener('resize', function() {
      //   if (document.documentElement.clientWidth >= 598 && zplayerBottom.className.match(/\s*expand-mobile/g)) {
      //     zplayerBottom.className =  zplayerBottom.className.replace(/expand-mobile/g, '');
      //   }
      // });

      // expander.addEventListener('click', function() {
      //   if (!zplayerBottom.className.match(/\s+expand-mobile/)) {
      //     zplayerBottom.className += 'expand-mobile';
      //   }
      // });

      // compresser.addEventListener('click', function() {
      //   console.log(zplayerBottom.className);
      //   if (zplayerBottom.className.match(/\s*expand-mobile/)) {
      //     zplayerBottom.className = zplayerBottom.className.replace(/expand-mobile/g, '');
      //   }
      // });

      // var player = document.createElement('audio');
      // player.volume = 0.5;
      // var trackDurationSlider =
      //   document.getElementById('track-duration-slider');
      // var playerVolumeSlider  =
      //   document.getElementById('player-volume-slider');

      // // scope.audio.addEventListener('play', function() {
      // player.addEventListener('play', function() {
      //   $rootScope.$broadcast(AUDIO.playing, scope.track);
      // });

      // // scope.audio.addEventListener('pause', function() {
      // player.addEventListener('pause', function() {
      //   $rootScope.$broadcast(AUDIO.paused, scope.track);
      // });

      // // scope.audio.addEventListener('ended', function() {
      // player.addEventListener('ended', function() {
      //   $rootScope.$broadcast(AUDIO.ended, scope.track);
      //   scope.next();
      // });

      // player.addEventListener('timeupdate', updateProgressBar);
      // trackDurationSlider.addEventListener('change', updateTrackCurrenTime);
      // trackDurationSlider.addEventListener('input', updateTrackCurrenTime);

      // playerVolumeSlider.addEventListener('change', updatePlayerVolume);
      // playerVolumeSlider.addEventListener('input', updatePlayerVolume);

      // function updateProgressBar() {
      //   var progressWidth = '';
      //   var trackCurrentTime = player.currentTime;
      //   var tarckDuration = player.duration;
      //   scope.currentTime = trackCurrentTime;

      //   var currentTimePercentage =
      //     Math.floor((100 * trackCurrentTime) / tarckDuration);
      //   //document.querySelector('.duration-spin').style.width = currentTimePercentage + '%';
      //   trackDurationSlider.value = currentTimePercentage;
      //   scope.$apply();
      // }

      // function  updateTrackCurrenTime() {
      //   player.currentTime = trackDurationSlider.value * player.duration / 100;
      //   scope.$apply();
      // }

      // function  updatePlayerVolume() {
      //   player.volume = playerVolumeSlider.value / 100;
      //   scope.$apply();
      //   console.log(player.volume);
      // }

      //scope.playing = !player.paused; //scope.audio.paused;

      /* On reload fetch and set last played song. */
      scope.track =
        QueueSvc.getCurrentTrack() && QueueSvc.getCurrentTrack().track;
      // if (scope.track) {
      //   player.src = scope.track.streamUrl;
      // }

      scope.$on(AUDIO.playPause, function() {
        scope.playPause();
      });

      // scope.$on(AUDIO.ended, function() {
      //   scope.stop();
      // });

      // scope.$on(AUTH.logoutSuccess, function() {
      //   scope.stop();
      //   scope.track = {};
      // });

      // scope.$on(AUTH.notAuthenticated, function() {
      //   scope.stop();
      // });

      scope.$on(AUDIO.set, function(event, track) {
        scope.track = track;
        sound       = loadTrack(track, true); 
        // player.src  = track.streamUrl;
        // scope.duration = player.duration;

        if (!Auth.isAuthenticated()) {
          $rootScope.$broadcast(AUTH.notAuthenticated);
          MessageSvc.addMsg('danger', 'Log in first to play music!');
        } else {
          scope.playPause();
        }
        /*scope.audio.src = track.streamUrl;
        scope.audio.play();*/
      });

      // scope.next = function() {
      //   //$rootScope.$broadcast(QUEUE.next);
      //   QueueSvc.playNext();
      // };

      // scope.prev = function() {
      //   //$rootScope.$broadcast(QUEUE.prev);
      //   QueueSvc.playPrev();
      // };

      // scope.playPause = function() {
      //   // scope.audio.paused ? scope.audio.play() : scope.audio.pause();
      //   player.paused ? player.play() : player.pause();
      //   scope.playing = player.paused || player.ended ? false : true;
      // };

      // scope.stop = function() {
      //   player.pause();
      //   scope.playing = false;
      //   player.currentTime = 0;
      // };

      // scope.mute = function() {
      //   player.muted = !player.muted;
      // };

      // scope.muted = function() {
      //   return player.muted;
      // };

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
              album.img = '/assets/albums/' + album._id + '/tof';
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

          Tracks.find(param, function(tracks) {
            angular.forEach(tracks, function(track) {
              Tracks.inflate(track._id, this, function(track) {
                track.img = '/assets/tracks/' + track._id + '/tof';
              }, function() {});
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
.directive('zSearchBox', ['$http', function($http) {
  return {
    restrict: 'E',
    // require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      scope.search = {searchTerm: ''};
      var endpoint = 'api/search';
      var searches = [];
      var config   = {
        params: {
          q: scope.search.searchTerm,
        },
        cache: true
      };

      function isNewSearchTerm(query) {
        if (searches.length) {
          for (var i = 0; i < searches.length; i++) {
            if (searches[i] === query || query.search(searches[i]) === 0) {
              return false;
            }

            if (searches[i].search(query) === 0) {
              searches[i] = query;
              return true;
            }
          }
        }
        // if it's truly a new search...
        searches.push(query);
        return true;
      }

      scope.goFetch = function goFetch(query) {
        if (query && isNewSearchTerm(query)) {
          config.params.q = query;
          $http.get(endpoint, config).then(function(response) {
            scope.search = response.data;
            if (scope.search.users.length) {
              var users = [];
              angular.forEach(scope.search.users, function(user) {
                user.img = '/assets/users/' + user._id + '/tof';
                this.push(user);
              }, users);
              scope.search.users = users;
            }

            if (scope.search.albums.length) {
              var albums = [];
              angular.forEach(scope.search.albums, function(album) {
                album.img = '/assets/albums/' + album._id + '/tof';
                this.push(album);
              }, albums);
              scope.search.albums = albums;
            }

            if (scope.search.tracks.length) {
              var tracks = [];
              angular.forEach(scope.search.tracks, function(track) {
                track.img = '/assets/tracks/' + track._id + '/tof';
                this.push(track);
              }, tracks);
              scope.search.tracks = tracks;
            }
          });
        }
      };
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
.directive('datepicker', [function() {
  return {
    restrict: 'A',
    require:  'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      function updateModel(dateText) {
        scope.$apply(function() {
          ctrl.$setViewValue(dateText);
        });
      }

      var options = {
        dateFormat: 'yy-mm-dd',
        onSelect: function(dateText) {
          updateModel(dateText);
        }
      };

      if (!Modernizr.inputtypes.date) {
        elm.datepicker(options);
      }
    }
  };
}])
.directive('zCollapse', ['$document', function($document) {
  return {
    restrict: 'A',
    link: function(scope, elm) {
      elm.on('click', 'a', function() {
        elm.collapse('hide');
      });
    }
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
