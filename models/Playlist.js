var mongoose    = require('mongoose'),
    TrackSchema = require('./Track.js');

var PlaylistSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  title_lower: { type: String, required: true, lowercase: true, select: false },
  ownerId:     { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  tracks:      { type: Array },
  updated_at:  { type: Date, default: Date.now }
});

PlaylistSchema.pre('save', function(next) {
  var playlist = this;
  if(playlist.isModified('title')) playlist.title_lower = playlist.title;
});

PlaylistSchema.set('toJSON', {
    transform: function(doc, ret, options) {
      delete ret.title_lower;
      return ret;
    }
});

module.exports = mongoose.model('Playlist', PlaylistSchema);
