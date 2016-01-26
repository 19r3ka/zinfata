var express = require('express');
var auth = require('basic-auth');
var oAuthClientModel = require('../models/OAuthClient');
//var utils   = require('./../bin/utils');
var oAuthAccessTokenModel   = require('./../models/OAuthAccessToken');
var oAuthRefreshTokenModel   = require('./../models/OAuthRefreshToken');

//var request = require('request');
var router = express.Router();
router.post('/', function(req, res, next){

	// utils.checkIsValidPost(req, next);
	var client_id, client_secret;
	var user = auth(req);
	if (user) {
		client_id = user.name;
		client_secret = user.pass;
	} else if (req.body.client_id && req.body.client_secret) {
		client_id = req.body.client_id;
		client_secret = req.body.client_secret;
	}

	if (!client_id || !client_secret){
		var error = new Error();
		error.status = 400;
		error.error_description = 'Missing parameters. \'client_id\' and \'client_secret\' are required';;
		error.error = 'invalid_request';
		return next(error); 
	}
	//utils.checkIsValidTokenRevokeRequest(req, next);

	if (!req.body.token_type_hint){
		var error = new Error();
		error.status = 400;
		error.error_description = 'Missing parameters. \'token_type_hint\' is required';
		error.error = 'invalid_request';
		return next(error); 
	}

	if (!req.body.token_type_hint.match('refresh_token|access_token')) {
		var error = new Error();
		error.status = 400;
		error.error_description = '\'token_type_hint\' parameter value must be either \'refresh_token\' or \'access_token\'';
		error.error = 'invalid_request';
		return next(error); 
	}

	if (!req.body.token) {
		var error = new Error();
		error.status = 400;
		error.error_description = 'Missing parameters. \'token\' is required';
		error.error = 'invalid_request';
		return next(error); 
	}

	//check client credentials
	oAuthClientModel.getClient(client_id, client_secret, function(err, client){
		if (err) return next(err);
		if (!client) {
			var error = new Error();
			error.status = 400;
			error.error_description = 'Client credentials are invalid';
			error.error = 'invalid_grant';
			return next(error);

		} 

		var token_type_hint = req.body.token_type_hint;
		var token = req.body.token;

		if (token_type_hint === 'refresh_token') {
			oAuthRefreshTokenModel.revokeRefreshToken(token, function(err, revokedToken){
				if (err) return next(err);
				if (!revokedToken) {
					var error = new Error();
					error.status = 404;
					error.error_description = 'Token not found';
					error.error = 'Not Found';
					return next(error);
				}
				res.sendStatus(200);

			});
		}else if (token_type_hint === 'access_token') {
			oAuthAccessTokenModel.revokeAccessToken(token, function(err, revokedToken){
				if (err) return next(err);
				if (!revokedToken) {
					var error = new Error();
					error.status = 404;
					error.error_description = 'Token not found';
					error.error = 'Not Found';
					return next(error);
				}
				res.sendStatus(200);

			});
		}

	});

	


});

module.exports = router;