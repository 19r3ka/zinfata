module.exports = function(wagner) {
  var express     = require('express');
  var router      = express.Router();

  router.route('/soundcloud')
  .get(function(req, res, next) {
    wagner.invoke(function(Config) {
      res.json(Config.soundcloud);
    });
  });
  return router;
};
