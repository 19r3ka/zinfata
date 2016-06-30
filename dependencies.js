
var _           = require('underscore');
var config      = require('./config/config');
var MailService = require('./lib/services/ZinfataMailerService');
var ZError      = require('./lib/errors/ZinfataError');
var ZOAuthError = require('./lib/errors/ZinfataOAuthError');

//Models
var models = {
  Album:             require('./models/Album'),
  OAuthAccessToken:  require('./models/OAuthAccessToken'),
  OAuthClient:       require('./models/OAuthClient'),
  OAuthRefreshToken: require('./models/OAuthRefreshToken'),
  PasswordToken:     require('./models/PasswordToken'),
  Playlist:          require('./models/Playlist'),
  Track:             require('./models/Track'),
  User:              require('./models/User')
};

module.exports = function(wagner) {
  wagner.factory('Config', function() {
    return config;
  });

  wagner.factory('mailService', function() {
    return new MailService(config.mail);
  });
  //errors
  wagner.factory('ZOAuthError', function() {
    return ZOAuthError;
  });

  wagner.factory('ZError', function() {
    return ZError;
  });

  //create models services
  _.each(models, function(element, index, list) {
    wagner.factory(index, function() {
      return element;
    });
  });
};
