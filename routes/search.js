module.exports = function(wagner) {
  var router = require('express').Router();
  router.route('/')
  .post(function(req, res, next) {
    wagner.invoke(function(User, Album, Track, ZError) {
      if (!req.query.q) {
        return next(new ZError('invalid_request', 'You must specify a search query.'));
      }
      var offset = req.query.o || 0;
      var limit  = 50;
      var searchTerm = {
        $regex:   req.query.q,
        $options: 'i'
      }
      var query  = {
        titleLower: searchTerm,
        deleted:    false
      };
      var result = {
        searchTerm: req.query.q,
        offset: offset,
        limit:  limit
      };

      if (offset) {
        query.updatedAt = { $lte: offset }
      }

      Track.find(query)
      .sort('-updatedAt')
      .limit(100)
      .exec(function(err, tracks) {
        if (err) {
          return next(err);
        }
        result.tracks = tracks;

        Album.find(query)
        .sort('-updatedAt')
        .limit(100)
        .exec(function (err, albums) {
          if (err) {
            return next(err);
          }
          result.albums = albums;

          // Adapt query object to User model search
          delete query.titleLower;
          query.activated = true;
          query.handleLower = searchTerm;

          User.find(query)
          .sort('-updatedAt')
          .limit(100)
          .exec(function(err, users) {
            if (err) {
              return next(err); 
            }
            result.users = users;

            res.status(200).json(result);
          });
        });
      });
    });
  });
  return router;
};