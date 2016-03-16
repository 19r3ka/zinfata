var mongoose = require('mongoose');

var TrackSchema = new mongoose.Schema( {
  title:        { type: String, required: true },
  title_lower: 	{ type: String, lowercase: true, select: false },
  artistId:  	  { type: String, required: true },
  feat:       	{ type: Array, default: [] },      // for the IDs of all contributing artists
  size:         { type: String, required: true },
  duration:     { type: String, required: true },
  sharing:      { type: Boolean, default: false }, // should the track be available to others
  downloadable: { type: Boolean, default: false },
  albumId:   	  { type: String, required: true },
  coverArt: 	  { type: String, required: true },
  streamUrl: 	  { type: String, required: true },
  genre:        { type: String, lowercase: true, required: true },
  releaseDate: 	{ type: Date, required: true },
  updated_at: 	{ type: Date, default: Date.now }
});

TrackSchema.pre('save', function(next) {
  var track = this;
  if(track.isModified('title')) track.title_lower = track.title;
  next();
});

TrackSchema.set('toJSON', {
    transform: function(doc, ret, options) {
      delete ret.title_lower;
      return ret;
    }
});

module.exports = mongoose.model('Track', TrackSchema);
