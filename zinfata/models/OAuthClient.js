var mongoose = require('mongoose');
var crypto = require('crypto');
var clientIdPattern = /^[a-z][a-z0-9]{2,}$/;
var urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
var emailRegex  = new RegExp("^[-a-z0-9~!$%^&*_=+}{\\'?]+(\\.[-a-z0-9~" +
                            "!$%^&*_=+}{\\'?]+)*@([a-z0-9_][a-z0-9_]*" +
                            "(\\.[-a-z0-9_]+)*\\.(aero|arpa|biz|com|coop|" +
                            "edu|gov|info|int|mil|museum|name|net|org|" +
                            "pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\\." +
                            "[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}))(:[0-9]{1,5})?$",'i');
var OAuthClientSchema = new mongoose.Schema({
	clientId:      { type: String, required: true, unique: true,  lowercase: true, match: clientIdPattern },
 	clientSecret:  { type: String,  required: true, minlength: 6 },
 	redirectUri:   { type: String }
  /*
  appName : {type: String, required:true, minlength: 4, maxlength: 32},
  organisation : {type: String, required:true},
  description : {type: String, required:true, minlength: 10, maxlength: 200},
  website: {type: String, match: urlPattern},
  active: {type: Boolean, default: false},
  supportEmail: {type: String, required:true, match: emailRegex},
  supportUrl: {type: String, required:true}
  */
});

OAuthClientSchema.statics.getClient = function (clientId, clientSecret, callback) {
  console.log('in getClient (clientId: ' + clientId + ', clientSecret: ' + clientSecret + ')');
  if (clientSecret === null) {
    return OAuthClientModel.findOne({ clientId: clientId }, callback);
  }
  OAuthClientModel.findOne({ clientId: clientId, clientSecret: clientSecret }, callback);
};

// This will very much depend on your setup, I wouldn't advise doing anything exactly like this but
// it gives an example of how to use the method to resrict certain grant types
//var authorizedClientIds = ['s6BhdRkqt3', 'toto', 'zinfata'];
OAuthClientSchema.statics.grantTypeAllowed = function (clientId, grantType, callback) {
  console.log('in grantTypeAllowed (clientId: ' + clientId + ', grantType: ' + grantType + ')');

  if (grantType === 'password' || grantType === 'refresh_token') {
    //return callback(false, authorizedClientIds.indexOf(clientId) >= 0);
    return callback(false, true);
  }

  return callback(false, false);
};

var OAuthClientModel = mongoose.model('OAuthClient', OAuthClientSchema);


function generateRandomId() {
  crypto.randomBytes(20, function(ex, buf) {
    if (ex) throw ex;
    console.log(buf.toString('hex'));
    return buf.toString('hex');

  });
}

function generateRandomSecret() {
  crypto.randomBytes(40, function(ex, buf) {
    if (ex) throw ex;
    console.log(buf.toString('hex'));
    return buf.toString('hex');

  });
}

module.exports  = OAuthClientModel;
