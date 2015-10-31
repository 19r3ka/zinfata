var express  = require('express');
var router   = express.Router();

var mongoose = require('mongoose');
var User     = require('../models/User.js');
var PwdToken = require('../models/PasswordToken.js');
var passport = require('../config/passport.js');

var multer   = require('multer');
var upload   = multer(
    { dest: 'public/images/uploads'}
);

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
    res.status(201).json(new_user);
  });
});

router.route('/:id')
.get(function(req, res, next) { /* GET specific user */
  User.findById(req.params.id, function(err, user) {
    if(err) return next(err);
    res.json(user);
  });
})
.put(upload.single('avatar'), function(req, res, next) { /* UPDATE specific user */ //Must be protected somehow
  User.findById(req.params.id, function(err, user) {
    if(err) return next(err);
    if(!user) return next(new Error('not found'));
    //if(req.user.id !== user.id) return next(new Error('forbidden'));
    for(var key in user) {
      if(!!req.body[key]) user[key] = req.body[key];
    }
    if(!!req.file) user.avatarUrl = req.file.path;
    console.log(user);
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
    //if(req.user.id !== deleted_user.id) return next(new Error('forbidden'));
    deleted_user.remove(function(err, user) {
      res.json(deleted_user);
    });
  });
});
router.route('/reset-password/:email')
.get(function(req, res, next) {
  User.findOne({email: req.params.email}, function(err, user) {
    if(err) return next(err);
    if(!user) return next(new Error('not found'));
    PwdToken.generateToken(function(token) {
      var pwdToken = new PwdToken({
        user_id: user._id,
        token: token,
      });
      pwdToken.save(function(err, token) {
        if(err) return next(err);
        // TODO: here is where we send out the email
        // or Whatsapp message
        // with the generated token.
        console.log('Here is the generated token: ' + token);
        res.sendStatus(204);
      });
      return;
    });
  });
})
router.route('/reset-password/validate-token/:token')
.get(function(req, res, next) {
  PwdToken.findOne({token: req.params.token}, function(err, token) {
    if(err) return next(err);
    if(!token) return next(new Error('not found'));
    if(req.query.get_user) {
      res.json(token);
    } else {
      res.sendStatus(204);
    }
  });
})

module.exports = router;
