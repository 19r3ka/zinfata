/**
This module ensure that a user can only login if he is not deleted (deleted field in User model set to false)
**/
module.exports =  function(wagner) {
  return function(req, res, next) {
    var grantType = req.body.grant_type;
    if (!!grantType && grantType.match(/(password|refresh_token)/)) {
      wagner.invoke(function(User, ZError, OAuthRefreshToken) {
        var errorMessage = 'The user account ' +
        'you\'re trying to login with does not exist';
        switch (grantType) {
          case 'password':
            User.findOne({handle: req.body.username, deleted: true},
              function(err, user) {
                if (err) {
                  return next(err);
                } else if (user) {
                  return next(new ZError('invalid_request', errorMessage));
                }
                return next();
              });
          break;
          case 'refresh_token':
            OAuthRefreshToken.findOne({refreshToken: req.body.refresh_token})
            .populate('userId').exec(function(err, refreshToken) {
              if (err) {
                return next(err);
              }
              if (!refreshToken) {
                return next(new ZError('not_found', 'RefreshToken not found'));
              }
              if (refreshToken && refreshToken.userId.deleted) {
                return next(new ZError('invalid_request', errorMessage));
              }
              return next();
            });
          break;
        }
      });
    } else { return next(); }
  };
};
