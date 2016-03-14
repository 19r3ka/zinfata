var mongoose    = require('mongoose'),
    TrackSchema = require('./Track.js');

var PlaylistSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  title_lower: { type: String, required: true, lowercase: true, select: false },
  ownerId:     { type: String, required: true },
  tracks:      { type: Array },
  updated_at:  { type: Date, default: Date.now }
});

PlaylistSchema.pre('save', function(next) {
  var playlist = this;
  if(playlist.isModified('title')) playlist.title_lower = playlist.title;
};

module.exports = mongoose.model('Playlist', PlaylistSchema);
