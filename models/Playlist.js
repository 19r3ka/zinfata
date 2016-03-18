var mongoose    = require('mongoose'),
    TrackSchema = require('./Track.js');

var PlaylistSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  titleLower: { type: String, required: true, lowercase: true, select: false },
  ownerId:     { type: String, required: true },
  tracks:      { type: Array },
  updatedAt:  { type: Date, default: Date.now }
});

PlaylistSchema.pre('save', function(next) {
  var playlist = this;
  if(playlist.isModified('title')) playlist.titleLower = playlist.title;
});

PlaylistSchema.set('toJSON', {
    transform: function(doc, ret, options) {
      delete ret.titleLower;
      return ret;
    }
});

module.exports = mongoose.model('Playlist', PlaylistSchema);
