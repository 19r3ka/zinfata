module.exports = function(wagner){

  var express  = require('express'),
      router   = express.Router();


  var passport = require('../config/passport.js');
  var zerror, Playlist;
  wagner.invoke(function(ZError, Playlist){
      zerror = ZError;
      Playlist = Playlist;

  });


  router.route('/')
  .get(function(req, res, next) { // GET all playlists listing.
    /*TODO: Move every call to playlist by a criteria to a new endpoint
      with the form '/:searchby/:search*/
    Playlist.find(function(err, playlists) {
      if(err) return next(err);
      if(!playlists.length) return next(new zerror('not_found', 'Playlist not found'));
      res.json(playlists);
    });
  })
  .post(function(req, res, next) { // POST new album
      console.log(req.body);
      var pl  = req.body,
          arr = [];
      /* turn the stringified array back into a real array */
      if(typeof pl.tracks === 'string') pl.tracks = pl.tracks.split(',');

      new_playlist = new Playlist({
          title:    pl.title,
          ownerId:  pl.ownerId,
          tracks:   pl.tracks
      });

      if(!!!new_playlist.ownerId && !!req.user.id) new_playlist.ownerId = req.user.id;
      
      new_playlist.save(function(err, playlist) {
          console.log(playlist);
          if(err) return next(err);
          res.json(playlist);
      });
  })
  router.route('/:resource/:resource_id')
  .get(function(req, res, next) {
    if('resource' in req.params && req.params.resource === 'owner') {
      Playlist.find({ownerId: req.params.resource_id}, function(err, playlists) {
        if(err) return next(err);
        if(!playlists.length) return next(new zerror('not_found', 'Playlist not found'));
        res.json(playlists);
      });
    }
  })
  router.route('/:id')
  .get(function(req, res, next) { // GET specific album by ID
    Playlist.findById(req.params.id, function(err, playlist) {
      if(err) return next(err);
      if(!playlist) return next(new zerror('not_found', 'Playlist not found'));
      res.json(playlist);
    });
  })
  .put(function(req, res, next) { // UPDATE album info by ID
    Playlist.findOne({ _id: req.params.id }, function(err, playlist) {
      if(err) return next(err);
      if(!playlist) return next(new zerror('not_found', 'Playlist not found'));
      
      for(var key in playlist) {
        if(!!req.body[key]) playlist[key] = req.body[key]; // Since it's a blind attribution, only update keys that already exit.
      }

      playlist.save(function(err, updated_playlist) {
        if(err) return next(err);
        res.json(updated_playlist);
      });
    });
  })
  .delete(function(req, res, next) { // DELETE album by ID
    Playlist.findById(req.params.id, function(err, playlist) {
      if(err) return next(err);
      if(!playlist) return next(new zerror('not_found', 'Playlist not found'));
      
      playlist.remove(function(err, deleted_playlist) {
        if(err) return next(err);
        res.json(deleted_playlist);
      });
    });
  });


  //module.exports = router;
  return router;
}

