module.exports = function(wagner) {
  var express  = require('express');
  var router   = express.Router();

  var mongoose = require('mongoose');
  //var User     = require('../models/User.js');
  //var PwdToken = require('../models/PasswordToken.js');
  var passport = require('../config/passport.js');
  //var zerror = require('../lib/errors/ZinfataError');

  var multer   = require('multer');
  var upload   = multer(
      { dest: 'public/images/uploads'}
  );

  var userModel, PwdToken, zerror;
  wagner.invoke(function(User, ZError, PasswordToken){
    zerror = ZError;
    userModel = User;
    PwdToken = PasswordToken;
  });
  var User = userModel;


  router.route('/')
  .get(function(req, res, next) { /* GET users listing. */
    User.find(function(err, users) {
      if(err) return next(err);
      res.json(users);
    });
  })
  .post(function(req, res, next) { /* POST new user */
    var user = new User({
      firstName: req.body.firstName,
      lastName:  req.body.lastName,
      handle:    req.body.handle,
      email:     req.body.email,
      password:  req.body.password
    });
    User.findOne({handle: req.body.handle}, function(err, user) {
      if(err) return next(err);
      //if(user) return next(new Error('duplicate: handle'));
      if(user) return next(new zerror('bad_param', 'handle is already in use'));
    });
    User.findOne({email: req.body.email}, function(err, user) {
      if(err) return next(err);
      //if(user) return next(new Error('duplicate: email'));
      if(user) return next(new zerror('bad_param', 'email is already in use'));
    });
    user.save(function(err, new_user){
      if(err) return next(err);
      /* Make sure that the password hash is not sent to the user */
      new_user.password = null;
      PwdToken.generateToken(function(token) {
        var pwdToken = new PwdToken({
          user_id:  user._id,
          token:    token,
          purpose:  'usr_activation'
        });
        pwdToken.save(function(err, token) {
          if(err) return next(err);
          // TODO: here is where we send out the email
          // or Whatsapp message
          // with the generated token.
          console.log('the activation link will be : http://localhost:3000/register/activate/' + token.token);
          wagner.invoke(function(MailService){
            var activationLink = 'http://localhost:3000/register/activate?token=' + token.token;
            MailService.sendWelcomeMail(new_user.email, new_user.firstName, activationLink, function(err, infos){
              if(err) { 
                //if the confirmation email is not send the user can not activate its account so delete the user
                User.remove({email: new_user.email}, function(error, deletedUser){
                    if (error) { //delete error
                      return next(err);
                    } else {
                      return next(new zerror('server_error', 'An error occured when trying to send the activation email'));
                    }
                });
                return;
              }
              console.log('Activation mail send to ' + new_user.email + ' ['+new_user.handle + ']');
              res.status(201).json(new_user);
            });
          });
        });
      });
    });
  });

  router.route('/:id')
  .get(function(req, res, next) { /* GET specific user */
    User.findById(req.params.id, function(err, user) {
      if(err) return next(err);
      if(!user) return next(new Error('not found'));
      res.json(user);
    });
  })
  .put(upload.single('avatar'), function(req, res, next) { /* UPDATE specific user */ //Must be protected somehow
    User.findById(req.params.id, function(err, user) {
      if(err) return next(err);
      if(!user) return next(new Error('not found'));
      for(var key in user) {
        if(!!req.body[key]) user[key] = req.body[key];
      }
      if(!!req.file) user.avatarUrl = req.file.path;
      user.save(function(err, updated_user) {
        if(err) return next(err);
        res.json(updated_user);
      });
    });
  })
  .delete(function(req, res, next) { /* DELETE specific user */
    User.findById(req.params.id, req.body, function(err, deleted_user) {
      if(err) return next(err);
      if(!deleted_user) return next(new zerror('not_found', 'User not found'));
      //if(req.user.id !== deleted_user.id) return next(new Error('forbidden'));
      deleted_user.remove(function(err, user) {
        res.json(deleted_user);
      });
    });
  });
  router.route('/handle/:handle')
  .get(function(req, res, next) {
    if('handle' in req.params && !!req.params.handle) {
      User.findOne({handle: req.params.handle.toLowerCase()}, function(err, user) {
        if(err) return next(err);
        if(!user) return next(new Error('not found'));
        res.json(user);
      });
    }
  });
  router.route('/validate-token/:token')
  .get(function(req, res, next) {
    PwdToken.findOne({ token: req.params.token }, function(err, token) {
      if(err) return next(err);
      if(!token) return next(new zerror('not_found', 'Token not found'));
      if(token.purpose === 'usr_activation') {
      User.findById(token.user_id, function(err, user) {
          if(err) return next(err);
          if(!user) return next(new zerror('not_found', 'User not found'));
          user.activated = true;
          user.save(function(err, new_user) {
            if(err) return next(err);
          });
        });
      }
      res.sendStatus(204);
    });
    return;
  });
  router.route('/tokenize/:action/:email')
  .get(function(req, res, next) {
    User.findOne({email: req.params.email}, function(err, user) {
      if(err) return next(err);
      if(!user) return next(new zerror('not_found', 'User not found'));
      PwdToken.generateToken(function(new_token) {
        PwdToken.findOne({ user_id: user._id }, function(err, old_token) {
          if(old_token) old_token.remove(function(err, old_token){});
        });

        var pwdToken = new PwdToken({
          user_id: user._id,
          token: new_token,
        });

        if(req.params.action === 'usr_activation') pwdToken.purpose = 'usr_activation';

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
  });

  return router;
};
