var express  = require('express');
var router   = express.Router();

var mongoose = require('mongoose');
var Playlist = require('../models/Playlist.js');

var passport = require('../config/passport.js');

router.route('/')
.get(function(req, res, next) { // GET user's playlists listing.
  Playlist.find({ artist_id: req.query.u_id }, function(err, playlist) {
    if(err) return next(err);
    res.json(playlist);
  });
})
.post(passport.authenticate('local'), function(req, res, next) { // POST new album
  new_playlist = new Playlist(req.body);
  new_playlist.owner_id = req.user.id;
  new_playlist.save(function(err, playlist) {
    if(err) return next(err);
    res.json(playlist);
  });
})

router.route('/:id')
.get(function(req, res, next) { // GET specific album by ID
  Playlist.findById(req.params.id, function(err, playlist) {
    if(err) return next(err);
    res.json(playlist);
  });
})
.put(passport.authenticate('local'), function(req, res, next) { // UPDATE album info by ID
  Playlist.findOne({ _id: req.params.id }, function(err, playlist) {
    if(err) return next(err);
    if(!playlist) return next(new Error('not found'));
    if(req.user.id !== playlist.owner_id) return next(new Error('forbidden'));
    for(var key in req.body) {
      playlist[key] = req.body[key];
    }
    playlist.save(function(err, updated_playlist) {
      if(err) return next(err);
      res.json(updated_playlist);
    });
  });
})
.delete(passport.authenticate('local'), function(req, res, next) { // DELETE album by ID
  Playlist.findById(req.params.id, function(err, playlist) {
    if(err) return next(err);
    if(!playlist) return next(new Error('not found'));
    if(req.user.id !== playlist.owner_id) return next(new Error('forbidden'));
    playlist.remove(function(err, deleted_playlist) {
      if(err) return next(err);
      res.json(deleted_playlist);
    });
  });
});


module.exports = router;
