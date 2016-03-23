module.exports = function(wagner) {
  var express  = require('express');
  var router   = express.Router();

  var mongoose = require('mongoose');
  //var User     = require('../models/User.js');
  //var PwdToken = require('../models/PasswordToken.js');
  // var passport = require('../config/passport.js');
  //var ZError = require('../lib/errors/ZinfataError');

  var multer   = require('multer');
  var upload   = multer({
    dest: 'public/images/uploads'
  });

  var userModel;
  var PwdToken;
  var Zerror;
  var config;
  wagner.invoke(function(User, ZError, PasswordToken, Config) {
    Zerror    = ZError;
    userModel = User;
    PwdToken  = PasswordToken;
    config    = Config[express().get('env')];
  });
  var User    = userModel;
  var zUrl    = config.host + ':' + config.port;

  /*function lowerCase(doc, field) {
    doc[field + '_lower'] = doc[field].toLowerCase();
  };*/

  router.route('/')
  .get(function(req, res, next) { /* GET users listing. */
    User.find(function(err, users) {
      if (err) { return next(err); }
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

    /* Checks if the handle is taken */
    User.findOne({handleLower: req.body.handle.toLowerCase()},
      function(err, user) {
      if (err) { return next(err); }
      if (user) {
        return next(new Zerror('bad_param', 'handle is already in use'));
      }
    });
    /* Checks if the email is taken */
    User.findOne({email: req.body.email.toLowerCase()}, function(err, user) {
      if (err) { return next(err); }
      //if (user) return next(new Error('duplicate: email'));
      if (user) {
        return next(new Zerror('bad_param', 'email is already in use'));
      }
    });

    user.save(function(err, newUser) {
      if (err) {
        return next(err);
      }
      /* Make sure that the password hash is not sent to the user */
      PwdToken.generateToken(function(token) {
        var pwdToken = new PwdToken({
          userId:  user._id,
          token:    token,
          purpose:  'usr_activation'
        });
        pwdToken.save(function(err, token) {
          if (err) {return next(err);}
          // TODO: here is where we send out the email
          // or Whatsapp message
          // with the generated token.
          console.log('the activation link will be : ' +
                      zUrl + '/register/activate/?token=' +
                      token.token);
          wagner.invoke(function(mailService) {
            var activationLink = zUrl + '/register/activate?token=' +
                                 token.token;
            mailService.sendWelcomeMail(newUser.email, newUser.firstName,
              activationLink, function(err, infos) {
              if (err) {
                //if the confirmation email is not send the user can not activate its account so delete the user
                User.remove({email: newUser.email},
                    function(error, deletedUser) {
                  if (error) {
                    return next(err);
                  } else {
                    return next(new Zerror('server_error',
                      'Error while sending the activation email'));
                  }
                });
                return;
              }
              console.log('Activation mail send to ' + newUser.email + ' [' +
                          newUser.handle + ']');
              res.status(201).json(newUser);
            });
          });
        });
      });
    });
  });

  router.route('/:id')
  .get(function(req, res, next) { /* GET specific user */
    User.findById(req.params.id, function(err, user) {
      if (err)   {return next(err);}
      if (!user) {return next(new Zerror('not_found', 'User not found'));}
      res.json(user);
    });
  })
  .put(upload.single('avatar'), function(req, res, next) { /* UPDATE specific user */ //Must be protected somehow
    User.findById(req.params.id, function(err, user) {
      if (err)   {return next(err);}
      if (!user) {return next(new Zerror('not_found', 'User not found'));}
      for (var key in user) {
        if (key === 'role' || key === 'activated') {continue;}
        if (!!req.body[key]) {user[key] = req.body[key];}
      }
      if (!!req.file) {user.avatarUrl = req.file.path;}
      user.save(function(err, updatedUser) {
        if (err) {return next(err);}
        res.json(updatedUser);
      });
    });
  })
  .delete(function(req, res, next) { /* DELETE specific user */
    User.findById(req.params.id, req.body, function(err, userToDelete) {
      if (err) {return next(err);}
      if (!userToDelete) {
        return next(new Zerror('not_found', 'User not found'));
      }
      userToDelete.deleted = true;
      userToDelete.save(function(err, deletedUser) {
        res.json(deletedUser);
      });
    });
  });
  router.route('/handle/:handle')
  .get(function(req, res, next) {
    if ('handle' in req.params && !!req.params.handle) {
      User.findOne({handleLower: req.params.handle.toLowerCase()},
        function(err, user) {
        if (err)   {return next(err);}
        if (!user) {return next(new Zerror('not_found', 'User not found'));}
        res.json(user);
      });
    }
  });
  router.route('/validate-token/:token')
  .get(function(req, res, next) {
    PwdToken.findOne({token: req.params.token}, function(err, token) {
      if (err) {return next(err);}
      if (!token) {return next(new Zerror('not_found', 'Token not found'));}
      if (token.purpose === 'usr_activation') {
        User.findById(token.userId, function(err, user) {
          if (err)   {return next(err);}
          if (!user) {return next(new Zerror('not_found', 'User not found'));}
          user.activated = true;
          user.save(function(err, newUser) {
            if (err) {return next(err);}
          });
        });
      }
      res.sendStatus(204);
    });
    return;
  });
  router.route('/tokenize/:action/:email')
  .get(function(req, res, next) {
    User.findOne({email: req.params.email.toLowerCase()}, function(err, user) {
      if (err)   {return next(err);}
      if (!user) {return next(new Zerror('not_found', 'User not found'));}
      PwdToken.generateToken(function(newToken) {
        PwdToken.findOne({userId: user._id}, function(err, oldToken) {
          if (oldToken) {oldToken.remove(function(err, oldToken) {});}
        });

        var pwdToken = new PwdToken({
          userId: user._id,
          token: newToken,
        });

        if (req.params.action === 'usr_activation') {
          pwdToken.purpose = 'usr_activation';
        }

        pwdToken.save(function(err, token) {
          if (err) {return next(err);}
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
