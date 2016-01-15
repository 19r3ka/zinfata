var OAuthRefreshToken = require('./OAuthRefreshToken'),
	OAuthAccessToken = require('./OAuthAccessToken'),
	OAuthClient= require('./OAuthClient'),
	User = require('./User');

var model = {};
model.saveAccessToken = OAuthAccessToken.saveAccessToken;
model.getAccessToken = OAuthAccessToken.getAccessToken;
model.saveRefreshToken = OAuthRefreshToken.saveRefreshToken;
model.revokeRefreshToken = OAuthRefreshToken.revokeRefreshToken;
model.getRefreshToken = OAuthRefreshToken.getRefreshToken;
model.getClient = OAuthClient.getClient;
model.grantTypeAllowed = OAuthClient.grantTypeAllowed;
model.getUser = User.getUser;


module.exports = model;