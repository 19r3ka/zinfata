var mongoose    = require('mongoose');
var TrackSchema = require('./Track.js');

var PlaylistSchema = new mongoose.Schema({
  title:       {type: String, required: true, trim: true},
  titleLower:  {type: String, lowercase: true, trim: true, select: false},
  ownerId:     {type: String, required: true},
  tracks:      {type: Array, default: []},
  deleted:     {type: Boolean, default: false},
  updatedAt:   {type: Date, default: Date.now}
});

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
