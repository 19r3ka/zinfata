
var _           = require('underscore');
var config      = require('./config/config');
var ZOAuthError = require('./lib/errors/ZinfataOAuthError');
var ZError      = require('./lib/errors/ZinfataError');
var MailService = require('./lib/services/ZinfataMailerService');

//Models
var models = {
  PasswordToken: require('./models/PasswordToken'),
  Album: require('./models/Album'),
  OAuthClient: require('./models/OAuthClient'),
  OAuthAccessToken: require('./models/OAuthAccessToken'),
  User: require('./models/User'),
  Playlist: require('./models/Playlist'),
  OAuthRefreshToken: require('./models/OAuthRefreshToken'),
  Track: require('./models/Track')
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
