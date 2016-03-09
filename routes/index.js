module.exports = function(wagner){
  var express = require('express');
  var router = express.Router();
  var zerror = wagner.invoke(function(ZOAuthError){return ZOAuthError});
  /*var passport = require('../config/passport');

  function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) return next();
    return next(new Error('forbidden'));
  }*/

  /* GET home page. */

  router.get('/partials/:name', function (req, res) {
    var name = req.params.name;
    res.render('app/components/' + name + '/' + name);
  });

  router.get('/templates/:name', function(req, res) {
    var name = req.params.name;
    res.render('app/shared/templates/' + name + 'Template');
  });

  router.get('/', function(req, res, next) {
    res.render('index', { title: 'Zinfata' });
  });

  router.get(/^\/(?!(api|partials|templates))/, function(req, res, next) {
    res.render('index', { title: 'Zinfata' });
  });

  return router;
}