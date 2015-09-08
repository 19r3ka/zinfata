var express  = require('express');
var router   = express.Router();

var mongoose = require('mongoose');
var User     = require('../models/User.js');
var Track    = require('../models/Track.js');

var passport = require('../config/passport.js');

router.route('/')
.get(function(req, res, next) { // GET all songs listing if query is empty.
  var query = {};
  if(req.query.u_id) { // GET all songs for user with u_id
    query.artist_id = req.query.u_id;
  }
  if(req.query.a_id) { // GET all songs for album with a_id
    query.album_id = req.query.a_id;
  }

  Track.find(query, function(err, tracks) {
    if(err) return next(err);
    res.json(tracks);
  });

})
.post(passport.authenticate('local'), function(req, res, next) { // POST new song
  new_track = new Track(req.body);
  new_track.artist_id = req.user.id;
  new_track.album_id = req.body.a_id;
  new_track.save(function(err, track) {
    if(err) return next(err);
    res.json(track);
  });
});

router.route('/:id')
.get(function(req, res, next) { // GET specific track by ID
  Track.findById(req.params.id, function(err, track) {
    if(err) return next(err);
    res.json(track);
  });
})
.put(passport.authenticate('local'), function(req, res, next) { // UPDATE album info by ID
  Track.findById(req.params.id, function(err, track) {
    if(err) return next(err);
    if(!track) return next(new Error('not found'));
    if(req.user.id !== track.artist_id) return next(new Error('forbidden'));
    for(var key in req.body) {
      track[key] = req.body[key];
    }
    track.save(function(err, updated_track){
      if(err) return next(err);
      res.json(updated_track);
    });
  });
})
.delete(passport.authenticate('local'), function(req, res, next) { // DELETE album by ID
  Track.findById(req.params.id, function(err, track) {
    if(err) return next(err);
    if(!track) return next(new Error('not found'));
    if(req.user.id !== track.artist_id) return next(new Error('forbidden'));
    track.remove(function(err, deleted_track){
      if(err) return next(err);
      res.json(deleted_track);
    });
  });
});

module.exports = router;
