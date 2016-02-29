module.exports = function(wagner) {

  var express  = require('express'),
      router   = express.Router();

  var UserModel, AlbumModel, TrackModel, zerror;

  wagner.invoke(function(User, Album, Track, ZError) {
    UserModel     = User;
    AlbumModel    = Album;
    TrackModel    = Track;
    zerror   = ZError;
  });
  var User     = UserModel,
      Album    = AlbumModel,
      Track    = TrackModel;
     
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
  .get(function(req, res, next) { // GET all songs listing.
    Track.find(function(err, tracks) {
      if(err) return next(err);
      if(!tracks.length) return next(new zerror('not_found', 'Track not found'));
      res.json(tracks);
    });
  })
  .post(uploadParams, function(req, res, next) { // POST new song
    var new_track = new Track({
      title:        req.body.title,
      artistId:     req.body.artistId,
      albumId:      req.body.albumId,
      releaseDate:  req.body.releaseDate || '',
      feat:         req.body.feat || [],
      duration:     req.body.duration
    });

    if(!!req.files.imageFile) {
      new_track.coverArt = req.files.imageFile[0].path;
    } else {
      new_track.coverArt = req.body.coverArt.replace('../..', 'public');
    }

    if(!!req.files.audioFile) {
      new_track.streamUrl = req.files.audioFile[0].path;
      new_track.size      = req.files.audioFile[0].size;
    }
    /*
     *Make sure artist exists and that the album is really his
     *before attempting to save
    */
    Album.find({artistId: new_track.artistId, _id: new_track.albumId}, function(err, album) {
      if(err) return next(err);
      if(!album) return next(new zerror('bad_param', 'invalid album / artist match'));
      if(!new_track.releaseDate || new_track.releaseDate > album.releaseDate ) {
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
      if(!track) return next(new zerror('not_found', 'Track not found'));
      res.json(track);
    });
  })
  .put(uploadParams, function(req, res, next) { // UPDATE album info by ID
    Track.findById(req.params.id, function(err, trackToUpdate) {
      if(err) return next(err);
      if(!trackToUpdate) return next(new zerror('not_found', 'Track not found'));
      //if(req.user.id !== album.artist_id) return next(new Error('forbidden'));
      for(var key in track) {
        if(!!req.body[key]) track[key] = req.body[key]; // Since it's a blind attribution, only update keys that already exit.
      }
      if(!!req.files.imageFile) {
        trackToUpdate.coverArt = req.files.imageFile[0].path;
      } else {
        if(req.body.coverArt) trackToUpdate.coverArt = req.body.coverArt.replace('../..', 'public');
      }

      if(!!req.files.audioFile) {
        trackToUpdate.streamUrl = req.files.audioFile[0].path;
        trackToUpdate.size      = req.files.audioFile[0].size;
      }
      
      trackToUpdate.save(function(err, updated_track) {
        if(err) return next(err);
        res.json(updated_track);
      });
    });
  })
  .delete(function(req, res, next) { // DELETE album by ID
    Track.findById(req.params.id, function(err, track) {
      if(err) return next(err);
      if(!track) return next(new zerror('not_found', 'Track not found'));
      //if(req.user.id !== track.artist_id) return next(new Error('forbidden'));
      track.remove(function(err, deleted_track) {
        if(err) return next(err);
        res.json(deleted_track);
      });
    });
  });

  router.route('/:resource/:resource_id')
  .get(function(req, res, next) {
    var query = {},
        key;

    switch(req.params.resource) {
      case 'album':
        key = 'albumId';
        break;
      case 'user':
        key = 'artistId';
        break;
      default:
        next(new zerror('bad_param', 'invalid resource requested'));
    }

    query[key] = req.params.resource_id;
    Track.find(query, function(err, tracks) {
      if(err) return next(err);
      if(!tracks) return next(new zerror('not_found', 'Track not found'));
      res.json(tracks);
    });
  });
  //module.exports = router;
  return router;
};
