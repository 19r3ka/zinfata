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
  User.findOne({handle: req.body.handle}, function(err, user) {
    if(err) return next(err);
    if(user) return next(new Error('duplicate: handle'));
  });
  User.findOne({email: req.body.email}, function(err, user) {
    if(err) return next(err);
    if(user) return next(new Error('duplicate: email'));
  });
  user.save(function(err, new_user){
    if(err) return next(err);
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
    if(!user) return next(new Error('not found'));
    if(req.user.id !== user.id) return next(new Error('forbidden'));
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
  User.findById(req.params.id, req.body, function(err, deleted_user) {
    if(err) return next(err);
    if(!deleted_user) return next(new Error('not found'));
    if(req.user.id !== deleted_user.id) return next(new Error('forbidden'));
    deleted_user.remove(function(err, user) {
      res.json(deleted_user);
    });
  });
});

module.exports = router;
