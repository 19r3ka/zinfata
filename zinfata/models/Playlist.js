var mongoose = require('mongoose'),
    TrackSchema = require('./Track.js');

var PlaylistSchema = new mongoose.Schema( {
  title:      { type: String, required: true },
  owner_id:   { type: String, required: true },
  tracks:     { type: Array},
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Playlist', PlaylistSchema);
