var express  = require('express');
var router   = express.Router();

var mongoose = require('mongoose');
var User     = require('../models/User.js');

var passport = require('../config/passport.js');

router.route('/')
.get(function(req, res, next) { /* GET users listing. */
  User.find(function(err, users) {
    if(err) return next(err);
    res.json(users);
  });
})
.post(function(req, res, next) { /* POST new user */
  var user = new User(req.body);
  user.save(function(err, new_user){
    if(err) return res.json(err);
    res.json(new_user);
  });
});

/* Route middleware to validate id */
router.param('id', function(req, res, next, id) {
  // TODO: Make sure to sanitize and clean up the param here
  req.id = id;
  next();
});

router.route('/:id')
.get(function(req, res, next) { /* GET specific user */
  User.findById(req.params.id, function(err, user) {
    if(err) return next(err);
    res.json(user);
  });
})
.put(passport.authenticate('local'), function(req, res, next) { /* UPDATE specific user */
  User.findById(req.user.id, req.body, function(err, user) {
    if(err) return next(err);
    for(var key in req.body) {
      user[key] = req.body[key];
    }
    user.save(function(err, updated_user){
      if(err) return next(err);
      res.json(updated_user);
    });
  });
})
.delete(passport.authenticate('local'), function(req, res, next) { /* DELETE specific user */
  User.findByIdAndRemove(req.params.id, req.body, function(err, deleted_user) {
    if(err) return next(err);
    res.json(deleted_user);
  });
});

module.exports = router;
