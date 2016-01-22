var mongoose = require('mongoose');
var OAuthClient = require('./OAuthClient');
var User = require('./User');

var OAuthAccessTokenSchema = new mongoose.Schema({
  accessToken:  { type: String, required: true, unique: true, lowercase: true },
  clientId:     { type: String, required: true, lowercase: true },
  userId:       { type: String, required: true, lowercase: true },
  expires:      { type: Date, required: true }
});


OAuthAccessTokenSchema.pre('save', function(next){

	//validate client id
	OAuthClient.findOne({clientId: this.clientId}, function(err, client){

		if (err) return next(err);
		if (!client) return next(new Error('Invalid clientId'));

		//validate user id
		User.findOne({id_: this.userId}, function(err, user){
			if (err) return next(err);
			if (!user) return next(new Error('Invalid userId'));
			console.log('save valid accessToken');
			next();

		}); 

	});
}); 

OAuthAccessTokenSchema.statics.getAccessToken = function (bearerToken, callback) {
  console.log('in getAccessToken (bearerToken: ' + bearerToken + ')');

  OAuthAccessTokenModel.findOne({ accessToken: bearerToken }, callback);
};


OAuthAccessTokenSchema.statics.saveAccessToken = function (token, clientId, expires, userId, callback) {
  console.log('in saveAccessToken (token: ' + token + ', clientId: ' + clientId + ', userId: ' + userId + ', expires: ' + expires + ')');
console.log(userId)
  if (typeof userId == 'object' && userId.id) userId = userId.id; //patch due to the fact that userId is object when requesting refresh token
  var accessToken = new OAuthAccessTokenModel({
    accessToken: token,
    clientId: clientId,
    userId: userId,
    expires: expires
  });

  accessToken.save(callback);
};

var OAuthAccessTokenModel =  mongoose.model('OAuthAccessToken', OAuthAccessTokenSchema);
module.exports = OAuthAccessTokenModel;