var oauth2Model = require('../models/OAuth');
var oauth2config = {
	model: oauth2Model,
	grants:['password', 'refresh_token'],
	accessTokenLifetime: 900, // 15 minutes
	refreshTokenLifetime: 604800 // 1 week
};

module.exports = oauth2config;