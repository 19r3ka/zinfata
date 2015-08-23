var express = require('express');
var router = express.Router();
var passport = require('../config/passport');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Zinfata' });
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/?success',
  failureRedirect: '/?failure'
}));

router.get('/logout', function(req, res) {
  req.logout();
  req.redirect('/');
});

module.exports = router;
