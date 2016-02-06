app.constant('ROUTES', {
  loginEndpoint:        'zinfataclient'
})
.constant('AUTH', {
  loginSuccess:         'auth-login-success',
  loginFailed:          'auth-login-failed',
  mustLogIn:            'auth-log-in-first',
  logoutSuccess:        'auth-logout-success',
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
  creationSuccess:      'user-creation-success',
  creationFailed:       'user-creation-failed',
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
  creationSuccess:      'track-creation-success',
  creationFailed:       'track-creation-failed',
  deleteSuccess:        'track-delete-success',
  deleteFailed:         'track-delete-failed'
}).constant('PLAYLIST_EVENTS', {
  updateSuccess:        'playlist-update-success',
  updateFailed:         'playlist-update-failed',
  creationSuccess:      'playlist-creation-success',
  creationFailed:       'playlist-creation-failed',
  deleteSuccess:        'playlist-delete-success',
  deleteFailed:         'playlist-delete-failed'
}).constant('QUEUE', {
  next:                 'queue-next-track',
  prev:                 'queue-previous-track'
}).constant('AUDIO', {
  set:                  'audio-set',
  playing:              'audio-playing',
  paused:               'audio-paused',
  ended:                'audio-ended'
});
