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

function findOrCreate(invitation, callback) {
  var Invitation = this;
  Invitation.findOne({contact: invitation.contact}, function(err, invite) {
    if (err) {
      return callback(err, null);
    }

    if (!invite) {
      var invite = new Invitation({
        contact:  invitation.contact,
        medium:   invitation.medium
      });

      return invite.save(callback);
    }

    // If found or created invitation
    return callback(null, invite);
  });
}

InvitationSchema.pre('validate', function(next) {
  if (!this.code) {
    this.code =   generateCode();
  }

  next();
});

InvitationSchema.pre('save', function(next) {
  /* When saving or updating a document's contact, reset accepted and codeSent attributes */
  if (this.isModified('contact')) {
    this.accepted = this.codeSent = false;
  }

  next();
});

InvitationSchema.statics.findOrCreate = findOrCreate;



var invitationModel = mongoose.model('Invitation', InvitationSchema);
module.exports = invitationModel;
