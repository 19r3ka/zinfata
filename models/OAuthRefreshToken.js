var mongoose = require('mongoose');
var OAuthClient = require('./OAuthClient');
var User = require('./User');

var OAuthRefreshTokenSchema = new mongoose.Schema({
	refreshToken: { type: String, required: true, unique: true, lowercase: true },
 	clientId: { type: String,  required: true, lowercase: true },
 	userId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
 	expires: { type: Date }
});

//oauth2-server call for "refreshtoken.user" first to get the user_id for grant_type=resfresh_token  
OAuthRefreshTokenSchema.virtual('user').get(function(){
	return this._id;
});

OAuthRefreshTokenSchema.pre('save', function(next){
	var self = this;

	//validate client id
	OAuthClient.findOne({clientId: self.clientId}, function(err, client){

		if (err) return next(err);
		if (!client) return next(new Error('Invalid clientId'));
		//we don't validate the userId because is already done in the schema by using 'ref' that is set to 'User'
		console.log('save valid refreshToken');
		next();

	});
});

OAuthRefreshTokenSchema.statics.saveRefreshToken = function (token, clientId, expires, userId, callback) {
  console.log('in saveRefreshToken (token: ' + token + ', clientId: ' + clientId +', userId: ' + userId + ', expires: ' + expires + ')');
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


