var mongoose = require('mongoose');
mongoose.Promise = global.Promise; // mPromise being now obsolete...

var InvitationSchema = mongoose.Schema({
  accepted:   {type: Boolean, default: false}, //whether or not user accepted the invitation
  code:       {type: String, length: 6, required: true},
  codeSent:   {type: Boolean, default: false},
  contact:    {type: String, required: true, trim: true, lowercase: true, index: {unique: true}},
  cookie:     {type: String, length: 24},
  createdAt:  {type: Date, default: Date.now},
  medium:     {type: String, required: true}
});

function generateCode() {
  // TODO: Generate random 6-digit number
  return Math.floor(100000 + Math.random() * 899999);
}

InvitationSchema.pre('validate', function(next) {
  this.code =   generateCode();
  next();
});

var invitationModel = mongoose.model('Invitation', InvitationSchema);
module.exports = invitationModel;
