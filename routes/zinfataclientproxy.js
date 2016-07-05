module.exports = function(wagner) {
  var config   = require('./../config/config');
  var error;
  var express  = require('express');
  var request  = require('request');
  var router   = express.Router();
  var ZError;
  wagner.invoke(function(ZOAuthError, Config) {
    ZError = ZOAuthError;
  });
  var zUrl    = (process.env.NODE_ENV === 'secure' ? 'https://' : 'http://') +
    config.host + ':' + config.port;

  router.post('/', function(req, res, next) {
    //utils.checkIsValidPost(req, next);
    if (!req.is('application/x-www-form-urlencoded'))  {
      error = new ZError('invalid_request',
        'Method must be POST with application/x-www-form-urlencoded encoding');
      return next(error);
    }

    if (!req.body.username || !req.body.password)  {
      error = new ZError('invalid_request',
        'Missing parameters. \'username\' and \'password\' are required');
      return next(error);
    }
    //proxy.web(req, res, {target: zUrl + '/oauth2/token'})
    request.post({
      url: zUrl + '/oauth2/token',
      form: {
        username: req.body.username,
        password: req.body.password ,
        grant_type:'password',
        client_id: config.oauth2.clientId,
        client_secret: config.oauth2.clientSecret
      }
    },
    function(err, httpResp, body) {
      if (err) {
        return next(err);
      }
      var statusCode = httpResp.statusCode || body.code;
      res.status(statusCode);
      res.json(JSON.parse(body));
    });
  });

  router.post('/refresh', function(req, res, next) {
    //utils.checkIsValidPost(req, next);
    if (!req.is('application/x-www-form-urlencoded'))  {
      error = new ZError('invalid_request',
        'Method must be POST with application/x-www-form-urlencoded encoding');
      return next(error);
    }

    if (!req.body.refresh_token) {
      error = new ZError('invalid_request',
        'Missing parameters. \'refresh_token\' is required');
      return next(error);
    }

    request.post({
      url: zUrl + '/oauth2/token',
      form: {
        refresh_token: req.body.refresh_token,
        grant_type:'refresh_token',
        client_id: config.oauth2.clientId,
        client_secret: config.oauth2.clientSecret
      }
    },
    function(err, httpResp, body) {
      if (err) {
        return next(err);
      }
      var statusCode = httpResp.statusCode || body.code;
      res.status(statusCode);
      res.send(JSON.parse(body));
    });

  });

  router.post('/revoke', function(req, res, next) {
    //utils.checkIsValidPost(req, next);
    if (!req.is('application/x-www-form-urlencoded'))  {
      error = new ZError('invalid_request',
        'Method must be POST with application/x-www-form-urlencoded encoding');
      return next(error);
    }
    //utils.checkIsValidTokenRevokeRequest(req, next);
    if (!req.body.token_type_hint) {
      error = new ZError('invalid_request',
        'Missing parameters. \'token_type_hint\' is required');
      return next(error);
    }

    //if (!req.body.token_type_hint.match('refresh_token|acces_token')) {
    if (req.body.token_type_hint != 'refresh_token' &&
      req.body.token_type_hint != 'access_token') {
      error = new ZError('invalid_request', 
        '\'token_type_hint\' parameter value must be ' +
        'either \'refresh_token\' or \'access_token\'');
      return next(error);
    }

    if (!req.body.token) {
      error = new ZError('invalid_request',
        'Missing parameters. \'token\' is required');
      return next(error);
    }
    var token_type_hint = req.body.token_type_hint;
    var token = req.body.token;

    request.post({
      url: zUrl + '/oauth2/revoke',
      form: {
        token_type_hint: token_type_hint,
        token: token,
        client_id: config.oauth2.clientId,
        client_secret: config.oauth2.clientSecret
      }
    },
    function(err, httpResp, body) {
      if (err) {
        return next(err);
      }
      var statusCode = httpResp.statusCode || body.code;
      res.status(statusCode);
      res.send(body);
    });

  });

  router.get('/me', function(req, res, next) {

    var data = req.query;
    if (!data.token) {
      error = new ZError('invalid_request', 'Missing token parameter');
      return next(error);
    }

    request.get({
      url: zUrl + '/oauth2/me',
      qs: {
        client_id: config.oauth2.clientId,
        client_secret: config.oauth2.clientSecret,
        token: data.token
      }
    },
    function(err, httpResp, body) {
      if (err) {
        return next(err);
      }
      var statusCode = httpResp.statusCode || body.code;
      res.status(statusCode);
      res.send(body);
    });
  });

  router.get('/tracks/:id/download', function(req, res, next) {
    var url     = zUrl + '/api/tracks/:id/download';
    var options = {
        headers: {Authorization: 'Bearer ' + req.query.token}
      };
    function callback(err, httpResp, body) {
      if (err) {
        var errMsg = 'Error downloading. ';
        if (httpResp.status === 401) {
          errMsg += 'Reload Zinfata and try again!';
        }
        if (httpResp.status === 404) {
          errMsg += 'That track does not exist!';
        }
        if (httpResp.status === 403) {
          errMsg += 'That track is not downloadable!';
        }
      }
      var statusCode = httpResp.statusCode || body.code;
      res.status(statusCode).send(new Buffer(body));
    }

    options.url = url.replace(':id', req.params.id);
    request(options, callback);

  });
  //module.exports = router;
  return router;
};
