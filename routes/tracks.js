module.exports = function(wagner) {

  var express  = require('express');
  var path     = require('path');
  var fs       = require('fs');
  var router   = express.Router();
  var UserModel;
  var AlbumModel;
  var TrackModel;
  var ZError;

  wagner.invoke(function(User, Album, Track, ZError) {
    UserModel     = User;
    AlbumModel    = Album;
    TrackModel    = Track;
    ZError        = ZError;
  });
  var User     = UserModel;
  var Album    = AlbumModel;
  var Track    = TrackModel;
  var multer   = require('multer');
  /*
  ** Used to customize the destination directory of
  ** files according to form fieldname. Image will go to
  ** /public/images while audio goes to /public/audio
  */
  var storage  = multer.diskStorage({
        destination: function(req, file, cb) {
          var folder = '';
          console.log(file);
          if (file.fieldname === 'imageFile') {
            folder = 'public/images/uploads';
          } else {
            folder = 'public/audio/uploads';
          }
          cb(null, folder);
        }
      });
  var upload  = multer({storage: storage});

  var uploadParams = upload.fields([
    {name: 'imageFile', maxCount: 1}, // Explicitly define
    {name: 'audioFile', maxCount: 1}  // accepted fieldnames for files
  ]);

  router.route('/')
  // GET all songs listing.
  .get(function(req, res, next) {
    Track.find(function(err, tracks) {
      if (err) {return next(err);}
      if (!tracks.length) {
        return next(new ZError('not_found', 'Track not found'));
      }
      res.json(tracks);
    });
  })
  // POST new song
  .post(uploadParams, function(req, res, next) {
    var newTrack = new Track({
      title:        req.body.title,
      artistId:     req.body.artistId,
      albumId:      req.body.albumId,
      releaseDate:  req.body.releaseDate || '',
      feat:         req.body.feat || [],
      duration:     req.body.duration,
      downloadable: req.body.downloadable,
      genre:        req.body.genre
    });

    if (!!req.files.imageFile) {
      newTrack.coverArt = req.files.imageFile[0].path;
    } else {
      newTrack.coverArt = req.body.coverArt.replace('../..', 'public');
    }

    if (!!req.files.audioFile) {
      newTrack.streamUrl = req.files.audioFile[0].path;
      newTrack.size      = req.files.audioFile[0].size;
    }
    /*
     *Make sure artist exists and that the album is really his
     *before attempting to save
    */
    Album.find({artistId: newTrack.artistId, _id: newTrack.albumId},
      function(err, album) {
      if (err) {return next(err);}
      if (!album) {
        return next(new ZError('bad_param', 'invalid album / artist match'));
      }
      if (!newTrack.releaseDate || newTrack.releaseDate > album.releaseDate) {
        newTrack.releaseDate = album.releaseDate;
      }
    });

    newTrack.save(function(err, track) {
      if (err) {return next(err);}
      User.findById(track.artistId, function(err, user) {
        if (err) {console.log(err);}
        if (user.role !== 'artist') {user.role = 'artist';}
        user.save();
      });
      res.json(track);
    });
  });

  router.route('/:id')
  // GET specific track by ID
  .get(function(req, res, next) {
    Track.findById(req.params.id, function(err, track) {
      if (err) {return next(err);}
      if (!track) {
        return next(new ZError('not_found', 'Track not found'));
      }
      res.json(track);
    });
  })
  // UPDATE album info by ID
  .put(uploadParams, function(req, res, next) {
    Track.findById(req.params.id, function(err, trackToUpdate) {
      if (err) {return next(err);}
      if (!trackToUpdate) {
        return next(new ZError('not_found', 'Track not found'));
      }
      // Since it's a blind attribution, only update keys that already exit.
      for (var key in trackToUpdate) {
        if (!!req.body[key]) {
          trackToUpdate[key] = req.body[key];
        }
      }
      if (!!req.files.imageFile) {
        trackToUpdate.coverArt = req.files.imageFile[0].path;
      } else if (req.body.coverArt) {
        trackToUpdate.coverArt = req.body.coverArt.replace('../..', 'public');
      }

      if (!!req.files.audioFile) {
        trackToUpdate.streamUrl = req.files.audioFile[0].path;
        trackToUpdate.size      = req.files.audioFile[0].size;
      }

      trackToUpdate.save(function(err, updatedTrack) {
        if (err) {return next(err);}
        res.json(updatedTrack);
      });
    });
  })
  .delete(function(req, res, next) {// DELETE album by ID
    Track.findById(req.params.id, function(err, track) {
      if (err) {return next(err);}
      if (!track) {
        return next(new ZError('not_found', 'Track not found'));
      }
      track.deleted = true;
      track.save(function(err, deletedTrack) {
        if (err) {return next(err);}
        res.json(deletedTrack);
      });
    });
  });

  router.route('/:id/download')
  .get(function(req, res, next) {
    Track.findById(req.params.id, function(err, track) {
      if (err) {return next(err);}
      if (!track) {
        return next(new ZError('not_found', 'Track not found'));
      }
      if (!track.downloadable) {
        return next(new ZError('forbidden', 'Track not downloadable'));
      }
      var downloadTitle = '[zinfata] ' + track.title;
      var downloadFile  = function(url) {
        var parentDir = __dirname.split('/');
        parentDir.splice(-1, 1);
        return parentDir.join('/') + '/' + url;
      };

      res.set('Content-Type', 'audio/mp3');
      res.set('Content-Disposition', 'attachment; filename=' + downloadTitle);
      res.status(200).download(downloadFile(track.streamUrl), downloadTitle);
    });
  });

  router.route('/:resource/:resourceId')
  .get(function(req, res, next) {
    var query = {};
    var key;

    switch (req.params.resource) {
      case 'album':
        key = 'albumId';
        break;
      case 'user':
        key = 'artistId';
        break;
      default:
        next(new ZError('bad_param', 'invalid resource requested'));
    }

    query[key] = req.params.resourceId;
    Track.find(query, function(err, tracks) {
      if (err) {return next(err);}
      if (!tracks) {
        return next(new ZError('not_found', 'Track not found'));
      }
      res.json(tracks);
    });
  });
  return router;
};
