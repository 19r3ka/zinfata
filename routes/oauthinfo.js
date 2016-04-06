module.exports = function(wagner) {
  var oAuthClientModel;
  var oAuthAccessTokenModel;
  var userModel;
  var ZError;
  wagner.invoke(function(OAuthClient, ZOAuthError, OAuthAccessToken, User) {
    oAuthClientModel = OAuthClient;
    oAuthAccessTokenModel = OAuthAccessToken;
    ZError = ZOAuthError;
    userModel = User;
  });
  var express = require('express');
  var router = express.Router();

  router.get('/', function(req, res, next) {
    var data = req.query;

    if (!data.client_id || !data.client_secret) {
      var error_description = !data.client_id ? 'Missing client_id parameter' :  'Missing client_secret parameter';
      var err = new ZError('invalid_request', error_description);
      return next(err);
    }

    if (!data.token) {
      var error = new ZError('invalid_request', 'Missing token parameter');
      return next(error);
    }

    var clientId     = data.client_id;
    var clientSecret = data.client_secret;
    var token        = data.token;

    oAuthClientModel.getClient(clientId, clientSecret, function(err, client) {

      if (err) {
        return next(err);
      }
      if (!client) {
        var error = new ZError('invalid_grant',
          'Client credentials are invalid');
        return next(error);
      }

      oAuthAccessTokenModel.findOne({clientId: clientId, accessToken: token},
      function(err, accessToken) {
      if (err) {
        return next(err);
      }
      if (!accessToken) {
        var error = new ZError('invalid_request', 'Invalid token');
        return next(error);
      }

      userModel.findById(accessToken.userId, function(err, user) {
        if (err) {
          return next(err);
        }
        //the token owner doesn't exist
        if (!user) {
          var error = new ZError('invalid_request', 'Invalid token');
          return next(error);
        }

        res.status(200).json(user.getMetadata());
      });
    });
      //oAuthAccessTokenModel.getAccessToken(token,);
    });
  });

  return router;
};
