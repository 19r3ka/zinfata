var mongoose = require('mongoose'),
    crypto   = require('crypto');

var PwdTokenSchema = new mongoose.Schema( {
  user_id:    { type: String, required: true },
  token:      { type: String, required: true },
  created_at: { type: Date, default: Date.now, expires: '1h' }
});

PwdTokenSchema.statics.generateToken = function generateToken(cb) {
  length = 24;
  return cb(crypto.randomBytes(Math.ceil(length * 3 / 4))
    .toString('base64')
    .replace(/(\+|\/)/g, '0'));
};

module.exports = mongoose.model('PwdToken', PwdTokenSchema);
