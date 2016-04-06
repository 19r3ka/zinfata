var mongoose      = require('mongoose');
var TrackSchema   = require('./Track.js');
var User          = require('./User.js');
var userValidator = [User.validate,
  'The value of `{PATH}` is not valid.'];

var PlaylistSchema = new mongoose.Schema({
  title:       {type: String, required: true, trim: true},
  titleLower:  {type: String, lowercase: true, trim: true, select: false},
  ownerId:     {type: mongoose.Schema.ObjectId, ref: 'User', required: true,
    validate: userValidator},
  tracks:      {type: Array, default: []},
  deleted:     {type: Boolean, default: false},
  updatedAt:   {type: Date, default: Date.now}
});

PlaylistSchema.statics.findActive = function(query, unique, callback) {
  var playlist = this;
  if (!query) {
    query = {};
  }
  query.deleted = false;

  if (unique) {
    playlist.findOne(query, callback);
  } else {
    playlist.find(query, callback);
  }
};

PlaylistSchema.pre('save', function(next) {
  var playlist = this;
  if (playlist.isModified('title')) {playlist.titleLower = playlist.title;}
  next();
});

PlaylistSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    delete ret.titleLower;
    delete ret.deleted;
    return ret;
  }
});

module.exports = mongoose.model('Playlist', PlaylistSchema);
