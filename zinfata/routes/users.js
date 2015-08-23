var express  = require('express');
var router   = express.Router();

var mongoose = require('mongoose');
var User     = require('../models/User.js');

/* GET users listing. */
router.get('/', function(req, res, next) {
  User.find(function(err, users) {
    if(err) return next(err);
    res.json(users);
  });
});

/* POST new user */
router.post('/', function(req, res, next) {
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

/* GET specific user */
router.get('/:id', function(req, res, next) {
  User.findById(req.params.id, function(err, user) {
    if(err) return next(err);
    res.json(user);
  });
});

/* UPDATE specific user */
router.put('/:id', function(req, res, next) {
  User.findById(req.params.id, req.body, function(err, user) {
    if(err) return next(err);
    for(var key in req.body) {
      user[key] = req.body[key];
    }
    user.save(function(err, updated_user){
      if(err) return next(err);
      res.json(updated_user);
    });
  });
});

/* DELETE specific user */
router.delete('/:id', function(req, res, next) {
  User.findByIdAndRemove(req.params.id, req.body, function(err, user) {
    if(err) return next(err);
    res.json(user);
  });
});

module.exports = router;
