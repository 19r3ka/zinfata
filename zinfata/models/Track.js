var mongoose = require('mongoose');

var TrackSchema = new mongoose.Schema( {
  title:      { type: String, required: true, lowercase: true },
  artist_id:  { type: String, required: true },
  feat:       { type: Array }, //for the IDs of all contributing artists
  album_id:   { type: String, required: true },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Track', TrackSchema);
