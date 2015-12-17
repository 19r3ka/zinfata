app.constant('AUTH_EVENTS', {
  loginSuccess:     'auth-login-success',
  loginFailed:      'auth-login-failed',
  logoutSuccess:    'auth-logout-success',
  sessionTimeout:   'auth-session-timeout',
  notAuthenticated: 'auth-not-authenticated',
  notAuthorized:    'auth-not-authorized'
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
});
