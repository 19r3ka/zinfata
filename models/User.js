var mongoose    = require('mongoose');
var bcrypt      = require('bcrypt');
var crypto      = require('crypto');

var emailRegex  = new RegExp(
  '^[-a-z0-9~!$%^&*_=+}{\\\'?]+(\\.[-a-z0-9~' +
  '!$%^&*_=+}{\\\'?]+)*@([a-z0-9_][a-z0-9_]*' +
  '(\\.[-a-z0-9_]+)*\\.(aero|arpa|biz|com|coop|' +
  'edu|gov|info|int|mil|museum|name|net|org|' +
  'pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\\.' +
  '[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}))' +
  '(:[0-9]{1,5})?$','i');
var handleRegex = new RegExp('^[a-zA-Z0-9_]{3,}$');
var defaultUrl  = 'zinfataClient/assets/images/user-avatar-placeholder.png';

var UserSchema = new mongoose.Schema({
  firstName:       {type: String, required: true, trim: true},
  firstNameLower:  {type: String, lowercase: true, trim: true, select: false},
  lastName:        {type: String, required: true, trim: true},
  lastNameLower:   {type: String, lowercase: true, trim: true, select: false},
  handle:          {type: String, required: true, minlength: 3, trim: true,
                    match: handleRegex, index: {unique: true}},
  handleLower:     {type: String, trim: true, lowercase: true, select: false},
  email:           {type: String, required: true, match: emailRegex,
                    unique: true, lowercase: true, trim: true},
  password:        {type: String, required: true, trim: true, select: false},
  avatarUrl:       {type: String, trim: true, default: defaultUrl},
  bio:             {type: String, default: '', trim: true},
  role:            {type: String, default: 'fan', trim: true},
  whatsapp:        {type: String, default: '', trim: true},
  facebook:        {type: String, default: '', trim: true},
  twitter:         {type: String, default: '', trim: true},
  website:         {type: String, default: '', trim: true},
  activated:       {type: Boolean, default: false},
  deleted:         {type: Boolean, default: false, select: false},
  updatedAt:       {type: Date, default: Date.now}
});

/*
 * Required to support password grant type
 */
UserSchema.statics.getUser = function(handle, password, callback) {
  console.log('in getUser (handle: ' + handle +
              ', password: ' + password + ')');

  //userModel.findOne({handle: handle}, function(err, user) {
  userModel.findOne({handle: handle})
           .select('+password')
           .exec(function(err, user) {
    if (err)   {return callback(err);}
    if (!user) {return callback(null, false);}
    bcrypt.compare(password, user.password, function(err, res) {
      if (err) {return callback(err);}
      //if (res == true) return callback(null, user.handle);
      if (res === true) {return callback(null, user._id);}
      return callback(null, false);
    });
  });
};

UserSchema.statics.findActive = function(query, unique, callback) {
  var user = this;

  if (!query) {
    query = {};
  }
  query.deleted = false;

  if (unique) {
    user.findOne(query, callback);
  } else {
    user.find(query, callback);
  }
};

UserSchema.statics.validate = function(id, respond) {
  userModel.findById(id, function(err, usr) {
    respond(!!usr);
  });
};

UserSchema.methods.getMetadata = function() {
  //add key that you assume to be meta to the array
  var userMeta = ['_id', 'handle', 'email', 'role', 'activated', 'deleted'];
  var size     = userMeta.length;
  var metaKey;
  var meta     = {};

  if (userMeta && size) {
    for (var i = 0; i < size; i++) {
      metaKey       = userMeta[i];
      meta[metaKey] = this[metaKey] ? this[metaKey] : '';
    }
  }

  return meta;
};

UserSchema.pre('save', function(next) {
  var user = this;

  if (user.isModified('lastName')) {
    user.lastNameLower  = user.lastName;
  }

  if (user.isModified('firstName')) {
    user.firstNameLower = user.firstName;
  }

  if (user.isModified('handle')) {
    user.handleLower    = user.handle;
  }

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) {return next();}

  // generate a salt
  bcrypt.genSalt(11, function(err, salt) {
    if (err) {return next(err);}

    // hash the password along with our new salt
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) {return next(err);}

      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });
});

UserSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    delete ret.firstNameLower;
    delete ret.lastNameLower;
    delete ret.handleLower;
    delete ret.password;
    // delete ret.email;
    delete ret.activated;
    delete ret.deleted;
    return ret;
  }
});

UserSchema.methods.verifyPassword = function verifyPassword(login, cb) {
  return bcrypt.compare(login, this.password, cb);
};

var userModel  = mongoose.model('User', UserSchema);
module.exports = userModel;
