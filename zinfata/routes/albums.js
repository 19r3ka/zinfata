var express  = require('express');
var router   = express.Router();

var mongoose = require('mongoose');
var Album    = require('../models/Album.js');

var passport = require('../config/passport.js');

router.route('/')
.get(function(req, res, next) { // GET all albums listing.
  var query = {};
  if(req.query.u_id) query.artist_id = req.query.u_id;
  Album.find(function(err, albums) {
    if(err) return next(err);
    res.json(albums);
  });
})
.post(passport.authenticate('local'), function(req, res, next) { // POST new album
  new_album = new Album(req.body);
  new_album.artist_id = req.user.id;
  new_album.save(function(err, album) {
    if(err) return next(err);
    res.json(album);
  });
})

router.route('/:id')
.get(function(req, res, next) { // GET specific album by ID
  Album.findById(req.params.id, function(err, album) {
    if(err) return next(err);
    res.json(album);
  });
})
.put(passport.authenticate('local'), function(req, res, next) { // UPDATE album info by ID
  Album.findOne({ _id: req.params.id }, function(err, album) {
    if(err) return next(err);
    if(!album) return next(new Error('not found'));
    if(req.user.id !== album.artist_id) return next(new Error('forbidden'));
    for(var key in req.body) {
      album[key] = req.body[key];
    }
    album.save(function(err, updated_album) {
      if(err) return next(err);
      res.json(updated_album);
    });
  });
})
.delete(passport.authenticate('local'), function(req, res, next) { // DELETE album by ID
  Album.findById(req.params.id, function(err, album) {
    if(err) return next(err);
    if(err) return next(err);
    if(!album) return next(new Error('not found'));
    if(req.user.id !== album.artist_id) return next(new Error('forbidden'));
    album.remove(function(err, deleted_album) {
      if(err) return next(err);
      res.json(deleted_album);
    });
  });
});

module.exports = router;
