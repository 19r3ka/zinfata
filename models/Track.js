var mongoose = require('mongoose');

var TrackSchema = new mongoose.Schema( {
  title: 		    { type: String, required: true, lowercase: true },
  artistId:  	  { type: String, required: true },
  feat:       	{ type: Array, default: [] }, //for the IDs of all contributing artists
  size:         { type: String, required: true },
  duration:     { type: String, required: true },
  sharing:      { type: Boolean, default: false },
  downloadable: { type: Boolean, default: false },
  albumId:   	  { type: String, required: true },
  coverArt: 	  { type: String, required: true },
  streamUrl: 	  { type: String, required: true },
  genre:        { type: String },
  releaseDate: 	{ type: Date, default: Date.now },
  updated_at: 	{ type: Date, default: Date.now }
});

module.exports = mongoose.model('Track', TrackSchema);
