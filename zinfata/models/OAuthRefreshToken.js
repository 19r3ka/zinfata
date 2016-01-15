var mongoose = require('mongoose');
var OAuthClient = require('./OAuthClient');
var User = require('./User');

var OAuthRefreshTokenSchema = new mongoose.Schema({
	refreshToken: { type: String, required: true, unique: true, lowercase: true },
 	clientId: { type: String,  required: true, lowercase: true },
 	userId: { type: String, required: true, lowercase: true },
 	expires: { type: Date }
});


OAuthRefreshTokenSchema.pre('save', function(next){

	//validate client id
	OAuthClient.findOne({clientId: this.clientId}, function(err, client){

		if (err) return next(err);
		if (!client) return next(new Error('Invalid clientId'));
		//validate user id
		User.findOne({id_: this.userId}, function(err, user){
			if (err) return next(err);
			if (!user) return next(new Error('Invalid userId'));
			console.log('save valid refreshToken');
			next();

		});

	});
});

OAuthRefreshTokenSchema.statics.saveRefreshToken = function (token, clientId, expires, userId, callback) {
  console.log('in saveRefreshToken (token: ' + token + ', clientId: ' + clientId +', userId: ' + userId + ', expires: ' + expires + ')');
  if (typeof userId == 'object' && userId.id) userId = userId.id; //patch due to the fact that userId is object when requesting refresh token
  var refreshToken = new OAuthRefreshTokenModel({
    refreshToken: token,
    clientId: clientId,
    userId: userId,
    expires: expires
  });

  refreshToken.save(callback);
};

OAuthRefreshTokenSchema.statics.getRefreshToken = function (refreshToken, callback) {
  console.log('in getRefreshToken (refreshToken: ' + refreshToken + ')');

  OAuthRefreshTokenModel.findOne({ refreshToken: refreshToken }, callback);
};

OAuthRefreshTokenSchema.statics.revokeRefreshToken = function (refreshToken, callback) {
  console.log('in revokeRefreshToken (refreshToken: ' + refreshToken + ')');

	OAuthRefreshTokenModel.findOne({refreshToken: refreshToken}, function(err, refreshToken){
		if (err) return callback(err);
		if (!refreshToken) return callback(null, null);
		refreshToken.remove(function(err, deletedToken){
			return callback(err, deletedToken);
		});

	});
}

var OAuthRefreshTokenModel = mongoose.model('OAuthRefreshToken', OAuthRefreshTokenSchema);




module.exports = OAuthRefreshTokenModel;


