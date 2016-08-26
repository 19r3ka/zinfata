module.exports = function(wagner) {
  var comingSoon  = 'zinfataClient/app/campaigns/comingSoon/comingSoon';
  var express     = require('express');
  var index       = 'zinfataClient/index';
  var router      = express.Router();
  var ZError      = wagner.invoke(function(ZOAuthError) {return ZOAuthError;});
  /*var passport = require('../config/passport');

  function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) return next();
    return next(new Error('forbidden'));
  }*/

  if (express().get('env') !== 'development') {
    index       = 'dist/index';
    comingSoon  = 'dist/comingSoon';
  }

  router.get('/coming_soon', function(req, res) {
    res.render(comingSoon, {title: 'Zinfata is Coming!'});
  });

  // Special route for Google Search Console verification html file
  /*router.get(/^google/), function (req, res, next) {
    res.render('google28e97ac10741eeb.html');
  }*/

  router.get('/partials/:name', function(req, res) {
    var name = req.params.name;
    res.render('zinfataClient/app/components/' + name + '/' + name);
  });

  router.get('/templates/:name', function(req, res) {
    var name = req.params.name;
    res.render('zinfataClient/app/shared/templates/' + name + 'Template');
  });

  router.get('/', function(req, res, next) {
    res.render(index, {title: 'Zinfata'});
  });

  router.get(/^\/(?!(api|partials|templates))/, function(req, res, next) {
    res.render(index, {title: 'Zinfata'});
  });

  return router;
};
