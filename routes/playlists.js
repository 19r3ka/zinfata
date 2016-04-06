module.exports = function(wagner) {

  var express  = require('express');
  var router   = express.Router();

  var passport = require('../config/passport.js');
  var ZErr;
  var PlaylistModel;
  wagner.invoke(function(ZError, Playlist) {
    ZErr = ZError;
    PlaylistModel = Playlist;
  });
  Playlist = PlaylistModel;

  router.route('/')
  .get(function(req, res, next) { // GET all playlists listing.
    Playlist.findActive('', false, function(err, playlists) {
      if (err) {return next(err);}
      if (!playlists.length) {
        return next(new ZErr('not_found', 'Playlist not found'));
      }
      res.json(playlists);
    });
  })
  .post(function(req, res, next) { // POST new album
    var pl  = req.body;
    var arr = [];
    /* turn the stringified array back into a real array */
    if (typeof pl.tracks === 'string') {
      pl.tracks = pl.tracks.split(',');
    }

    newPlaylist = new Playlist({
      title:    pl.title,
      ownerId:  pl.ownerId,
      tracks:   pl.tracks
    });

    newPlaylist.save(function(err, playlist) {
      if (err) {return next(err);}
      res.status(201).json(playlist);
    });
  });

  router.route('/:resource/:resourceId')
  .get(function(req, res, next) {
    if ('resource' in req.params && req.params.resource === 'owner') {
      Playlist.findActive({ownerId: req.params.resourceId}, false, function(err, playlists) {
        if (err) {return next(err);}
        if (!playlists.length) {
          return next(new ZErr('not_found', 'Playlists not found'));
        }
        res.json(playlists);
      });
    }
  });

  router.route('/:id')
  .get(function(req, res, next) { // GET specific album by ID
    Playlist.findActive({_id: req.params.id}, true, function(err, playlist) {
      if (err) {return next(err);}
      if (!playlist) {
        return next(new ZErr('not_found', 'Playlist not found'));
      }
      res.json(playlist);
    });
  })
  .put(function(req, res, next) { // UPDATE album info by ID
    Playlist.findActive({_id: req.params.id}, true, function(err, playlist) {
      if (err) {
        return next(err);
      }
      if (!playlist) {
        return next(new ZErr('not_found', 'Playlist not found'));
      }

      for (var key in playlist) {
        if (!!req.body[key]) {
          // Since it's a blind attribution, only update keys that already exit.
          playlist[key] = req.body[key];
        }
      }

      playlist.save(function(err, updatedPlaylist) {
        if (err) {return next(err);}
        res.json(updatedPlaylist);
      });
    });
  })
  .delete(function(req, res, next) { // DELETE album by ID
    Playlist.findActive({_id: req.params.id}, true, function(err, playlist) {
      if (err) {
        return next(err);
      }
      if (!playlist) {
        return next(new ZErr('not_found', 'Playlist not found'));
      }
      playlist.deleted = true;
      playlist.save(function(err, deletedPlaylist) {
        if (err) {
          return next(err);
        }
        res.json(deletedPlaylist);
      });
    });
  });

  //module.exports = router;
  return router;
};
