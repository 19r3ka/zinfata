var mongoose = require('mongoose');

var AlbumSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  titleLower:  { type: String, lowercase: true, select: false },
  imageUrl:     { type: String, default: 'zinfataClient/assets/images/album-coverart-placeholder.png'},
  artistId:     { type: String, required: true },
  releaseDate:  { type: Date, required: true },
  updatedAt:   { type: Date, default: Date.now }
});

AlbumSchema.pre('save', function(next) {
  var album = this;
  if(album.isModified('title')) album.titleLower = album.title;
  next();
});

AlbumSchema.set('toJSON', {
    transform: function(doc, ret, options) {
      delete ret.titleLower;
      return ret;
    }
});

module.exports = mongoose.model('Album', AlbumSchema);