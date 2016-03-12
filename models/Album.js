var mongoose = require('mongoose');

var AlbumSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  title_lower:  { type: String, required: true, lowercase: true, select: false },
  imageUrl:     { type: String },
  artistId:     { type: String, required: true },
  releaseDate:  { type: Date, required: true },
  updated_at:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Album', AlbumSchema);