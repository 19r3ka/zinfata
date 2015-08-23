var mongoose = require('mongoose');

var TrackSchema = new mongoose.Schema( {
  title:      { type: String, required: true },
  artist:     { type: String, required: true },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Track', TrackSchema);