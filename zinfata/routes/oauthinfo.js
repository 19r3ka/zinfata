var express = require('express');
var oAuthClientModel = require('../models/OAuthClient');
var oAuthAccessTokenModel = require('../models/OAuthAccessToken');
var userModel = require('../models/User');
var router = express.Router();

router.get('/', function(req, res, next){

	var data = req.query;

	if (!data.client_id || !data.client_secret) {
		var err = new Error();
		err.status = 400;
		err.error = 'invalid_request';
		err.message = !data.client_id ? 'Missing client_id parameter' :  'Missing client_secret parameter';
		err.error_description = !data.client_id ? 'Missing client_id parameter' :  'Missing client_secret parameter';
		return next(err);
	}

	if (!data.token) {
		var err = new Error();
		err.status = 400;
		err.error = 'invalid_request';
		err.message = err.error_description = 'Missing token parameter' ;
		return next(err);
	}

	var clientId = data.client_id,
		clientSecret = data.client_secret,
		token = data.token;

	oAuthClientModel.getClient(clientId, clientSecret, function(err, client){

		if (err) return next(err);
		if (!client) {
			var error = new Error();
			error.status = 400;
			error.error_description = 'Client credentials are invalid';
			error.error = 'invalid_grant';
			return next(error);
		} 

	oAuthAccessTokenModel.findOne({clientId: clientId, accessToken: token},  function(err, accessToken){

		if (err) return next(err);
		if (!accessToken) {
			var error = new Error();
			error.status = 404;
			error.error_description = 'Token not found';
			error.error = 'Not Found';
			return next(error);
		}

		userModel.findById(accessToken.userId, function(err, user){
			if (err) return next(err);
			//the token owner doesn't exist
			if (!user) {
				var error = new Error();
				error.status = 404;
				error.error_description = 'Token owner not found';
				error.error = 'Not Found';
				return next(error);
			}

			res.status(200).json(user.getMetadata());

		});

	});

		//oAuthAccessTokenModel.getAccessToken(token,);

	});


});

module.exports = router;