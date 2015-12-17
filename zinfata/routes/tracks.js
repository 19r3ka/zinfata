var express  = require('express'),
    router   = express.Router(),
    mongoose = require('mongoose'),
    User     = require('../models/User.js'),
    Album    = require('../models/Album.js'),
    Track    = require('../models/Track.js');

var passport = require('../config/passport.js'),
    multer   = require('multer'),
    /* Used to customize the destination directory of 
    ** files according to form fieldname. Image will go to 
    ** /public/images while audio goes to /public/audio
    */
    storage  = multer.diskStorage({
      destination: function(req, file, cb) {
        var folder = '';
        console.log(file);
        if(file.fieldname === 'imageFile') {
          folder = 'public/images/uploads';
        } else {
          folder = 'public/audio/uploads';
        }
        cb(null, folder);
      }
    }),
    upload  = multer({ storage: storage });

var uploadParams = upload.fields([
  { name: 'imageFile', maxCount: 1 }, // Explicitly define
  { name: 'audioFile', maxCount: 1 }  // accepted fieldnames for files
]);

router.route('/')
.get(function(req, res, next) { // GET all songs listing if query is empty.
  var query = {};
  if(req.query.u_id) { // GET all songs for user with u_id
    query.artistId = req.query.u_id;
  }
  if(req.query.a_id) { // GET all songs for album with a_id
    query.albumId = req.query.a_id;
  }

  Track.find(query, function(err, tracks) {
    if(err) return next(err);
    if(!tracks.length) return next(new Error('not found'));
    res.json(tracks);
  });

})
.post(uploadParams, function(req, res, next) { // POST new song
  var new_track = new Track({
    title:        req.body.title,
    artistId:     req.body.artistId,
    albumId:      req.body.albumId,
    releaseDate:  req.body.releaseDate || '',
    feat:         req.body.feat || []
  });

  if(!!req.files['imageFile']) new_track.coverArt  = req.files['imageFile'][0].path;
  if(!!req.files['audioFile']) new_track.streamUrl = req.files['audioFile'][0].path;
  /*
   *Make sure artist exists and that the album is really his
   *before attempting to save
  */
  Album.find({artistId: new_track.artistId, _id: new_track.albumId}, function(err, album) {
    if(err) return next(err);
    if(!album) return next(new Error('bad_param'));
    if(!!!new_track.releaseDate) {
      new_track.releaseDate = album.releaseDate;
    }
  });
  new_track.save(function(err, track) {
    if(err) return next(err);
    res.json(track);
  });
});

router.route('/:id')
.get(function(req, res, next) { // GET specific track by ID
  Track.findById(req.params.id, function(err, track) {
    if(err) return next(err);
    if(!track) return next(new Error('not found'));
    res.json(track);
  });
})
.put(uploadParams, function(req, res, next) { // UPDATE album info by ID
  Track.findById(req.params.id, function(err, track) {
    if(err) return next(err);
    if(!track) return next(new Error('not found'));
    //if(req.user.id !== album.artist_id) return next(new Error('forbidden'));
    for(var key in track) {
      if(!!req.body[key]) track[key] = req.body[key]; // Since it's a blind attribution, only update keys that already exit.
    }
    if(!!req.files['imageFile']) new_track.coverArt  = req.files['imageFile'][0].path;
    if(!!req.files['audioFile']) new_track.streamUrl = req.files['audioFile'][0].path;
    
    track.save(function(err, updated_track) {
      if(err) return next(err);
      res.json(updated_track);
    });
  });
})
.delete(function(req, res, next) { // DELETE album by ID
  Track.findById(req.params.id, function(err, track) {
    if(err) return next(err);
    if(!track) return next(new Error('not found'));
    //if(req.user.id !== track.artist_id) return next(new Error('forbidden'));
    track.remove(function(err, deleted_track) {
      if(err) return next(err);
      res.json(deleted_track);
    });
  });
});

module.exports = router;
