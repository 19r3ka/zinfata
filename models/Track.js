var mongoose   = require('mongoose');
var defaultArt = 'zinfataClient/assets/images/track-coverart-placeholder.png';
var User       = require('./User.js');
var Album      = require('./Album.js');
var userValidator  = [User.validate,
  'The value of `{PATH}` is not valid.'];
var albumValidator = [Album.validate,
  'The value of `{PATH}` is not valid.'];

var TrackSchema = new mongoose.Schema({
  title:        {type: String, required: true},
  titleLower:   {type: String, lowercase: true, select: false},
  artistId:     {type: mongoose.Schema.ObjectId, ref: 'User', required: true,
    validate: userValidator},
  feat:         {type: [{type: mongoose.Schema.ObjectId, ref: 'User'}]},      // for the IDs of all contributing artists
  size:         {type: Number, required: true},
  duration:     {type: Number, required: true},
  sharing:      {type: Boolean, default: false}, // should the track be available to others
  downloadable: {type: Boolean, default: false},
  albumId:      {type: mongoose.Schema.ObjectId, ref: 'Album', required: true,
    validate: albumValidator},
  coverArt:     {type: String, default: defaultArt},
  streamUrl:    {type: String, required: true},
  genre:        {type: String, lowercase: true, required: true},
  releaseDate:  {type: Date, required: true},
  about:        {type: String, default: '', trim: true},
  lyrics:       {type: String, default: '', trim: true},
  deleted:      {type: Boolean, default: false},
  updatedAt:    {type: Date, default: Date.now}
});

TrackSchema.pre('save', function(next) {
  var track = this;
  if (track.isModified('title')) {
    track.titleLower = track.title;
  }
  next();
});

TrackSchema.statics.findActive = function(query, unique, callback) {
  var track = this;
  if (!query) {
    query = {};
  }
  query.deleted = false;

  if (unique) {
    track.findOne(query, callback);
  } else {
    track.find(query, callback);
  }
};

TrackSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    delete ret.titleLower;
    delete ret.deleted;
    return ret;
  }
});

module.exports = mongoose.model('Track', TrackSchema);
