module.exports = function(wagner) {
  var router = require('express').Router();
  wagner.invoke(function(User, Album, Track, ZError) {
    router.route('/users/:id/tof')
    .get(function(req, res, next) {
      User.findActive({_id: req.params.id}, true,
      function(err, user) {
        console.log('we hit the endpoint.');
        if (err) {return next(err);}
        if (!user) {return next(new ZError('not_found', 'User not found'));}
        res.sendFile(process.cwd() + '/' + user.avatarUrl);
      });
    });

    router.route('/albums/:id/tof')
    .get(function(req, res, next) {
      Album.findActive({_id: req.params.id}, true,
      function(err, album) {
        if (err) {return next(err);}
        if (!album) {return next(new ZError('not_found', 'Album not found'));}
        res.sendFile(process.cwd() + '/' + album.imageUrl);
      });
    });

    router.route('/tracks/:id/tof')
    .get(function(req, res, next) {
      Track.findActive({_id: req.params.id}, true,
      function(err, track) {
        if (err) {return next(err);}
        if (!track) {return next(new ZError('not_found', 'Track not found'));}
        res.sendFile(process.cwd() + '/' + track.coverArt);
      });
    });
  });

  return router;
};
