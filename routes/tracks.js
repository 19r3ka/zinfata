module.exports = function(wagner) {

  var AlbumModel;
  var express  = require('express');
  var fs       = require('fs');
  var path     = require('path');
  var router   = express.Router();
  var TrackModel;
  var UserModel;
  var ZErr;

  wagner.invoke(function(User, Album, Track, ZError) {
    UserModel     = User;
    AlbumModel    = Album;
    TrackModel    = Track;
    ZErr        = ZError;
  });
  var User     = UserModel;
  var Album    = AlbumModel;
  var Track    = TrackModel;
  var multer   = require('multer');
  var config   = require('../config/config');

  /*
  ** Used to customize the destination directory of
  ** files according to form fieldname. Image will go to
  ** /public/images while audio goes to /public/audio
  */
  var storage  = multer.diskStorage({
        destination: function(req, file, cb) {
          var folder = '';
          if (file.fieldname === 'imageFile') {
            folder = config.uploads.images.dest;
          } else {
            folder = config.uploads.sounds.dest;
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
    Track.find({deleted: false})
    .populate('artist album')
    .sort('-updatedAt')
    .limit(100)
    .exec(function(err, tracks) {
      if (err) {
        return next(err);
      }
      if (!tracks.length) {
        return next(new ZErr('not_found', 'Track not found'));
      }
      res.json(tracks);
    });
  })

  // POST new song
  .post(uploadParams, function(req, res, next) {
    var feat = [];
    var newTrack = new Track({
      title:        req.body.title,
      artist:       req.body.artistId,
      album:        req.body.albumId,
      releaseDate:  req.body.releaseDate,
      duration:     req.body.duration,
      about:        req.body.about,
      lyrics:       req.body.lyrics,
      downloadable: req.body.downloadable,
      genre:        req.body.genre
    });
    if (req.body.feat && req.body.feat instanceof Array &&
      req.body.feat.length > 0) {
      feat = req.body.feat;
    }
    newTrack.feat = feat;

    if (!!req.files.imageFile) {
      newTrack.coverArt = req.files.imageFile[0].path;
    } else {
      Album.findById(req.body.albumId, function(err, album) {
        if (err) {
          return next(err);
        }

        var defaultUrl = 'public/images/track-coverart-placeholder.png';
        newTrack.coverArt = !album ? defaultUrl : album.imageUrl;
      });
    }

    if (!!req.files.audioFile) {
      newTrack.streamUrl = req.files.audioFile[0].path;
      newTrack.size      = req.files.audioFile[0].size;
    }
    /*
    * Make sure artist exists and that the album is really his
    * before attempting to save
    */
    if (newTrack.artist && newTrack.album) {
      Album.findActive({artistId: newTrack.artist, _id: newTrack.album},
        true, function(err, album) {
        if (err) {
          return next(err);
        }
        if (!album) {
          return next(new ZErr('bad_param', 'invalid album / artist match'));
        }
        if (!newTrack.releaseDate || newTrack.releaseDate > album.releaseDate) {
          newTrack.releaseDate = album.releaseDate;
        }
      });
    }
    newTrack.save(function(err, track) {
      if (err) {
        return next(err);
      }
      // user becomes artist as soon as he has uploaded at least one track
      User.findActive({_id: track.artist}, true, function(err, user) {
        if (err) {
          return next(err);
        }
        if (user.role !== 'artist') {
          user.role = 'artist';
        }
        user.save();
      });
      res.status(201).json(track);
    });
  });

  router.route('/:id')
  // GET specific track by ID
  .get(function(req, res, next) {
    Track.findActive({_id: req.params.id}, true, function(err, track) {
      if (err) {return next(err);}
      if (!track) {
        return next(new ZErr('not_found', 'Track not found'));
      }
      res.json(track);
    });
  })
  // UPDATE album info by ID
  .put(uploadParams, function(req, res, next) {
    Track.findActive({_id: req.params.id}, true, function(err, trackToUpdate) {
      if (err) {
        return next(err);
      }

      if (!trackToUpdate) {
        return next(new ZErr('not_found', 'Track not found'));
      }

      // Since it's a blind attribution, only update keys that already exist.
      for (var key in trackToUpdate) {
        if (!!req.body[key]) {
          trackToUpdate[key] = req.body[key];
        }
      }

      // manually assign artist and album field since they have no correspondance in model
      trackToUpdate.album  = req.body.albumId;
      trackToUpdate.artist = req.body.artistId;

      if (!!req.files.imageFile) {
        trackToUpdate.coverArt = req.files.imageFile[0].path;
      } else {
        Album.findById(req.body.albumId, function(err, album) {
          var defaultUrl = 'public/images/track-coverart-placeholder.png';
          trackToUpdate.coverArt = err ? defaultUrl : album.imageUrl;
        });
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
    Track.findActive({_id: req.params.id}, true, function(err, track) {
      if (err) {return next(err);}
      if (!track) {
        return next(new ZErr('not_found', 'Track not found'));
      }
      track.deleted = true;
      track.save(function(err, deletedTrack) {
        if (err) {
          return next(err);
        }
        res.json(deletedTrack);
      });
    });
  });

  router.route('/:id/download')
  .get(function(req, res, next) {
    Track.findActive({_id: req.params.id}, true, function(err, track) {
      if (err) {return next(err);}
      if (!track) {
        return next(new ZErr('not_found', 'Track not found'));
      }
      if (!track.downloadable) {
        return next(new ZErr('forbidden', 'Track not downloadable'));
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
        key = 'album';
        break;
      case 'user':
        key = 'artist';
        break;
      default:
        next(new ZErr('bad_param', 'invalid resource requested'));
    }

    query[key] = req.params.resourceId;
    Track.findActive(query, false, function(err, tracks) {
      if (err) {
        return next(err);
      }
      if (!tracks.length) {
        return next(new ZErr('not_found', 'Track not found'));
      }
      res.json(tracks);
    });
  });
  return router;
};
