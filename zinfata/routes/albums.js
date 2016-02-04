var express  = require('express');
var router   = express.Router();

var mongoose = require('mongoose');
var Album    = require('../models/Album.js');

var passport = require('../config/passport.js');
var multer   = require('multer');
var upload   = multer(
    { dest: 'public/images/uploads'}
);

function isLoggedIn(req, res, next) {
  if(req.isAuthenticated()) return next();
  return next(new Error('forbidden'));
}

router.route('/')
.get(function(req, res, next) { // GET all albums listing.
  var query = {};
  if(req.query.u_id) query.artist_id = req.query.u_id;
  Album.find(function(err, albums) {
    if(err) return next(err);
    res.json(albums);
  });
})
.post(upload.single('coverArt'), function(req, res, next) { // POST new album
  var data = req.body;
  var new_album = new Album({
        title:          data.title,
        artistId:       data.artistId,
        releaseDate:    data.releaseDate
      });
  if(!!req.user) new_album.artistId = req.user.id;
  if(!!req.file) new_album.imageUrl = req.file.path;
  new_album.save(function(err, album) {
    if(err) return next(err);
    res.json(album);
  });
})
router.route('/user/:user_id') // get all albums with given user id
.get(function(req, res, next) {
	Album.find({ artistId: req.params.user_id }, function(err, albums) {
		if(err) return next(err);
    if(!albums) return next(new Error('not found'));
		res.json(albums);
	})
})

router.route('/:id')
.get(function(req, res, next) { // GET specific album by ID
  Album.findById(req.params.id, function(err, album) {
    if(err) return next(err);
    if(!album) return next(new Error('not found'));
    res.json(album);
  });
})
.put(upload.single('coverArt'), function(req, res, next) { // UPDATE album info by ID
  Album.findById(req.params.id, function(err, album) {
    if(err) return next(err);
    if(!album) return next(new Error('not found'));
    for(var key in album) {
      if(!!req.body[key]) album[key] = req.body[key]; // Since it's a blind attribution, only update keys that already exit.
    }
    if(!!req.file) album.imageUrl = req.file.path;
    album.save(function(err, updated_album) {
      if(err) return next(err);
      res.json(updated_album);
    });
  });
})
.delete(function(req, res, next) { // DELETE album by ID
  Album.findById(req.params.id, function(err, album) {
    if(err) return next(err);
    if(!album) return next(new Error('not found'));
    album.remove(function(err, deleted_album) {
      if(err) return next(err);
      res.json(deleted_album);
    });
  });
});

module.exports = router;
