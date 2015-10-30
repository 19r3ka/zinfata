var mongoose = require('mongoose'),
    Track = require('./Track.js');

var AlbumSchema = new mongoose.Schema({
  title:         { type: String, required: true, lowercase: true },
  img_url:       { type: String },
  artist_id:     { type: String, required: true },
  release_date:  { type: Date, required: true },
  updated_at:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('Album', AlbumSchema);