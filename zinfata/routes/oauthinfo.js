var express = require('express');
var oAuthClientModel = require('../models/OAuthClient');
var oAuthAccessTokenModel = require('../models/OAuthAccessToken');
var userModel = require('../models/User');
var zerror = require('../lib/ZinfataOAuthError');
var router = express.Router();

router.get('/', function(req, res, next){

	var data = req.query;

	if (!data.client_id || !data.client_secret) {

		var error_description = !data.client_id ? 'Missing client_id parameter' :  'Missing client_secret parameter';

		var err = new zerror('invalid_request', error_description);
		return next(err);
	}

	if (!data.token) {

		var err = new zerror('invalid_request', 'Missing token parameter' );
		return next(err);
	}

	var clientId = data.client_id,
		clientSecret = data.client_secret,
		token = data.token;

	oAuthClientModel.getClient(clientId, clientSecret, function(err, client){

		if (err) return next(err);
		if (!client) {
			
			var err = new zerror('invalid_grant', 'Client credentials are invalid');
			return next(err);
		} 

	oAuthAccessTokenModel.findOne({clientId: clientId, accessToken: token},  function(err, accessToken){

		if (err) return next(err);
		if (!accessToken) {

			var err = new zerror('invalid_request', 'Invalid token');
			return next(err);
		}

		userModel.findById(accessToken.userId, function(err, user){
			if (err) return next(err);
			//the token owner doesn't exist
			if (!user) {
				var err = new zerror('invalid_request', 'Invalid token');
				return next(error);
			}

			res.status(200).json(user.getMetadata());

		});

	});

		//oAuthAccessTokenModel.getAccessToken(token,);

	});


});

module.exports = router;