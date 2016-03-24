var mongoose = require('mongoose');
var OAuthClient = require('./OAuthClient');
var User = require('./User');

var OAuthAccessTokenSchema = new mongoose.Schema({
  accessToken:  { type: String, required: true, unique: true, lowercase: true },
  clientId:     { type: String, required: true, ref: 'OAuthClient.clientId', lowercase: true },
  userId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  expires:      { type: Date, required: true }
});

OAuthAccessTokenSchema.pre('save', function(next){
   var self = this;
	//validate client id
	OAuthClient.findOne({clientId: self.clientId}, function(err, client){

		if (err) return next(err);
		if (!client) return next(new Error('Invalid clientId'));
		//we don't validate the userId because is already done in the schema by using 'ref' that is set to 'User'
    console.log('save valid accessToken');
    next();

	});
}); 

OAuthAccessTokenSchema.statics.getAccessToken = function (bearerToken, callback) {
  console.log('in getAccessToken (bearerToken: ' + bearerToken + ')');

  OAuthAccessTokenModel.findOne({ accessToken: bearerToken }, callback);
};


OAuthAccessTokenSchema.statics.saveAccessToken = function (token, clientId, expires, userId, callback) {
  console.log('in saveAccessToken (token: ' + token + ', clientId: ' + clientId + ', userId: ' + userId + ', expires: ' + expires + ')');
  var accessToken = new OAuthAccessTokenModel({
    accessToken: token,
    clientId: clientId,
    userId: userId,
    expires: expires
  });
  accessToken.save(callback);
};

OAuthAccessTokenSchema.statics.revokeAccessToken = function (accessToken, callback) {
  console.log('in revokeAccessToken (accessToken: ' + accessToken + ')');

  OAuthAccessTokenModel.findOne({accessToken: accessToken}, function(err, accessToken){
    if (err) return callback(err);
    if (!accessToken) return callback(null, null);
    accessToken.remove(function(err, deletedToken){
      return callback(err, deletedToken);
    });

  });
}

var OAuthAccessTokenModel =  mongoose.model('OAuthAccessToken', OAuthAccessTokenSchema);
module.exports = OAuthAccessTokenModel;