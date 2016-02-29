var mongoose    = require('mongoose'),
   // Album       = require('./Album.js'),
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
  role:         { type: String, default: 'fan', trim: true },
  whatsapp:     { type: String, default: '', trim: true }, 
  activated:    { type: Boolean, default: false },
  updated_at:   { type: Date, default: Date.now }
});

/*
 * Required to support password grant type
 */
UserSchema.statics.getUser = function (handle, password, callback) {
  console.log('in getUser (handle: ' + handle + ', password: ' + password + ')');

  //userModel.findOne({ handle: handle}, function(err, user) {
  userModel.findOne({ handle: handle}).select('+password').exec(function(err, user) {
    if(err) return callback(err);
    if (!user) return callback(null, false);
    bcrypt.compare(password, user.password, function(err, res) {
      if(err) return callback(err);
      //if (res == true) return callback(null, user.handle);
      if (res === true) return callback(null, user._id);
      return callback(null, false);
    })

    
  })

};


UserSchema.methods.getMetadata = function(){
  //add key that you assume to be meta to the array
  var userMeta = ['_id', 'handle', 'email', 'role', 'activated'];
  var size = userMeta.length, 
    metaKey,
    meta = {};

  if (userMeta && size){
    for (var i = 0; i < size; i++) {
      metaKey = userMeta[i];
      meta[metaKey] = this[metaKey] ? this[metaKey] : '';
    }
  }

  return meta;
} 

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

var userModel = mongoose.model('User', UserSchema);
module.exports = userModel;
