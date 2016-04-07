var mongoose      = require('mongoose');
var User          = require('./User.js');
var defaultUrl    =
  'zinfataClient/assets/images/album-coverart-placeholder.png';
var userValidator = [User.validate,
  'The value of `{PATH}` is not valid.'];

var AlbumSchema = new mongoose.Schema({
  title:        {type: String, required: true, trim: true},
  titleLower:   {type: String, lowercase: true, select: false, trim: true},
  imageUrl:     {type: String, default: defaultUrl},
  artistId:     {type: mongoose.Schema.ObjectId, ref: 'User', required: true,
    validate: userValidator},
  releaseDate:  {type: Date, required: true},
  deleted:      {type: Boolean, default: false},
  updatedAt:    {type: Date, default: Date.now}
});

AlbumSchema.statics.findActive = function(query, unique, callback) {
  var album = this;
  if (!query) {
    query = {};
  }
  query.deleted = false;

  if (unique) {
    album.findOne(query, callback);
  } else {
    album.find(query, callback);
  }
};

AlbumSchema.statics.validate = function(id, respond) {
  albumModel.findById(id, function(err, alb) {
    respond(!!alb);
  });
};

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

var albumModel = mongoose.model('Album', AlbumSchema);
module.exports = albumModel;
