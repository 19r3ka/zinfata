var mongoose = require('mongoose'),
    TrackSchema = require('./Track.js');

var AlbumSchema = new mongoose.Schema( {
  title:      { type: String, required: true },
  artist_id:  { type: String, required: true },
  feat:       { type: Array, required: true }, //for the IDs of all contributing artists
  tracks:     [ TrackSchema ],
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Album', AlbumSchema);