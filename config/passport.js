var User     = require('../models/User.js'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy({
    usernameField: 'handle'
  }, function(username, password, done) {
  User.findOne({handle: username}, function(err, user) {
    if(err) return done(err);
    if(!user) {
      return done(null, false, {message: 'Incorrect handle / password combination'});
    }
    user.verifyPassword(password, function(err, isMatch) {
      if(err) done(err);
      if(isMatch) {
        return done(null, user);
      }else{
        return done(null, false, {message: 'Incorrect handle / password combination'});
      }
    });
  });
  }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

module.exports = passport;
