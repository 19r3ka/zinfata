var mongoose    = require('mongoose'),
    Album       = require('./Album.js'),
    bcrypt      = require('bcrypt'),
    crypto      = require('crypto'),
    emailRegex  = new RegExp("^[-a-z0-9~!$%^&*_=+}{\\'?]+(\\.[-a-z0-9~" +
                            "!$%^&*_=+}{\\'?]+)*@([a-z0-9_][a-z0-9_]*" +
                            "(\\.[-a-z0-9_]+)*\\.(aero|arpa|biz|com|coop|" +
                            "edu|gov|info|int|mil|museum|name|net|org|" +
                            "pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\\." +
                            "[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}))(:[0-9]{1,5})?$",'i'),
    handleRegex = new RegExp("^[a-z0-9_]{3,}$");


var UserSchema = new mongoose.Schema( {
  firstName:    { type: String, required: true, lowercase: true, trim: true },
  lastName:     { type: String, required: true, lowercase: true, trim: true },
  handle:       { type: String, required: true, minlength: 3, match: handleRegex, lowercase: true, index: {unique: true}, trim: true},
  email:        { type: String, required: true, match: emailRegex, unique: true, lowercase: true, trim: true},
  password:     { type: String, required: true, trim: true, select: false },
  avatarUrl:    { type: String, default: 'zinfataClient/assets/images/user-avatar-placeholder.png', trim: true},
  role:         { type: String, default: 'user', trim: true },
  whatsapp:     { type: String, default: '', trim: true }, 
  activated:    { type: Boolean, default: false },
  updated_at:   { type: Date, default: Date.now }
});

UserSchema.pre('save', function(next) {
  var user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next();

  // generate a salt
  bcrypt.genSalt(11, function(err, salt) {
    if (err) return next(err);

    // hash the password along with our new salt
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);

      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.verifyPassword = function verifyPassword(login, cb) {
  return bcrypt.compare(login, this.password, cb);
};

module.exports = mongoose.model('User', UserSchema);
