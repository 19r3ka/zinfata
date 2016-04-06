module.exports = function(wagner) {

  var express  = require('express');
  var router   = express.Router();

  var passport = require('../config/passport.js');
  var multer   = require('multer');
  var upload   = multer(
      {dest: 'public/images/uploads'}
  );

  var Zerror;
  var albumModel;
  wagner.invoke(function(ZError, Album) {
    Zerror = ZError;
    albumModel = Album;
  });

  var Album = albumModel;

  router.route('/')
  .get(function(req, res, next) { // GET all albums listing.
    Album.findActive('', false, function(err, albums) {
      if (err) {return next(err);}
      if (!albums) {return next(new Zerror('not_found', 'No album found'));}
      res.json(albums);
    });
  })
  .post(upload.single('coverArt'), function(req, res, next) { // POST new album
    var data      = req.body;
    var newAlbum = new Album({
      title:          data.title,
      artistId:       data.artistId,
      releaseDate:    data.releaseDate
    });
    if (!!req.file) {
      newAlbum.imageUrl = req.file.path;
    }
    newAlbum.save(function(err, savedAlbum) {
      if (err) {
        return next(err);
      }
      res.status(201).json(savedAlbum);
    });
  });

  router.route('/user/:userId') // get all albums with given user id
  .get(function(req, res, next) {
    Album.findActive({artistId: req.params.userId}, false, function(err, albums) {
      if (err) {return next(err);}
      if (!albums) {return next(new Zerror('not_found', 'User has no album'));}
      res.json(albums);
    });
  });

  router.route('/:id')
  // GET specific album by ID
  .get(function(req, res, next) {
    Album.findActive({_id: req.params.id}, true, function(err, album) {
      if (err) {
        return next(err);
      }
      if (!album) {
        return next(new Zerror('not_found', 'Album not found'));
      }
      res.json(album);
    });
  })
  // UPDATE album info by ID
  .put(upload.single('coverArt'), function(req, res, next) {
    Album.findActive({_id: req.params.id}, true, function(err, album) {
      if (err) {return next(err);}
      if (!album) {return next(new Zerror('not_found', 'Album not found'));}
      // Since it's a blind attribution, only update keys that already exit.
      for (var key in album) {
        if (!!req.body[key]) {album[key] = req.body[key];}
      }
      if (!!req.file) {album.imageUrl = req.file.path;}
      album.save(function(err, updatedAlbum) {
        if (err) {return next(err);}
        res.json(updatedAlbum);
      });
    });
  })
  // DELETE album by ID
  .delete(function(req, res, next) {
    Album.findActive({_id: req.params.id}, true, function(err, album) {
      if (err) {return next(err);}
      if (!album) {return next(new Zerror('not_found', 'Album not found'));}
      album.deleted = true;
      album.save(function(err, deletedAlbum) {
        if (err) {return next(err);}
        res.json(deletedAlbum);
      });
    });
  });

  //module.exports = router;
  return router;
};
