var mongoose = require('mongoose');

var AlbumSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  title_lower:  { type: String, lowercase: true, select: false },
  imageUrl:     { type: String, default: 'zinfataClient/assets/images/album-coverart-placeholder.png'},
  artistId:     { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  releaseDate:  { type: Date, required: true },
  updated_at:   { type: Date, default: Date.now }
});

AlbumSchema.pre('save', function(next) {
  var album = this;
  if(album.isModified('title')) album.title_lower = album.title;
  next();
});

AlbumSchema.set('toJSON', {
    transform: function(doc, ret, options) {
      delete ret.title_lower;
      return ret;
    }
});

module.exports = mongoose.model('Album', AlbumSchema);