var express = require('express');
var router = express.Router();
var passport = require('../config/passport');

function isLoggedIn(req, res, next) {
  if(req.isAuthenticated()) return next();
  return next(new Error('forbidden'));
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Zinfata' });
});

router.post('/login', passport.authenticate('local'), function(req, res) {
  res.json(req.user);
});

router.get('/logout', isLoggedIn, function(req, res) {
  req.logout();
});

router.get('/currentuser', function(req, res) {
  if(req.isAuthenticated) res.json(req.user);
  res.status(404);
});

module.exports = router;
