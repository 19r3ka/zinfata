var mongoose   = require('mongoose');
var defaultUrl = 'zinfataClient/assets/images/album-coverart-placeholder.png';

var AlbumSchema = new mongoose.Schema({

  title:        {type: String, required: true, trim: true},
  titleLower:   {type: String, lowercase: true, select: false, trim: true},
  imageUrl:     {type: String, default: defaultUrl},
  artistId:     { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  releaseDate:  {type: Date, required: true},
  deleted:      {type: Boolean, default: false},
  updatedAt:    {type: Date, default: Date.now}
});

AlbumSchema.pre('save', function(next) {
  var album = this;
  if (album.isModified('title')) {album.titleLower = album.title;}
  next();
});

AlbumSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    delete ret.titleLower;
    delete ret.deleted;
    return ret;
  }
});

module.exports = mongoose.model('Album', AlbumSchema);
