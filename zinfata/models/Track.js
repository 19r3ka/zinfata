var mongoose = require('mongoose');

var TrackSchema = new mongoose.Schema( {
  title: 		{ type: String, required: true, lowercase: true },
  artistId:  	{ type: String, required: true },
  feat:       	{ type: Array, default: [] }, //for the IDs of all contributing artists
  albumId:   	{ type: String, required: true },
  coverArt: 	{ type: String, required: true },
  streamUrl: 	{ type: String, required: true },
  releaseDate: 	{ type: Date, default: Date.now },
  updated_at: 	{ type: Date, default: Date.now }
});

module.exports = mongoose.model('Track', TrackSchema);
