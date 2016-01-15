var OAuthClient = require('../models/OAuthClient');
var express = require('express');
var router = express.Router();

router.route('/')
.get(function(req, res, next){//get all client apps
	OAuthClient.find({}, function(err, clients){
		if (err) return next(err);
		res.json(clients);
	})
	
})
.post(function(req, res, next){//register new client app
	var data = req.body;
	if (!data.client_id || !data.client_secret) {
		var err = new Error();
		err.status = 400;
		err.error = 'invalid_request';
		err.message = !data.client_id ? 'Missing client_id parameter' :  'Missing client_secret parameter';
		err.error_description = !data.client_id ? 'Missing client_id parameter' :  'Missing client_secret parameter';
		return next(err);
	}

	new_client = new OAuthClient({
		clientId: data.client_id,
	 	clientSecret: data.client_secret,
	 	redirectUri: data.redirect_uri
	});

	new_client.save(function(err, client){
		if (err.code == 11000) {
			var err = new Error();
			err.status  = 400;
			err.error = 'duplicate_client';
    		err.message = 'Bad Input Parameter';
    		err.details = 'client id is already in use';
    		return next(err);
		}

		if (err) return next(err);
		res.json(client);
	});

});

router.route('/:id')
.get(function(req, res, next){//get client app by id
	OAuthClient.findOne({clientId: req.params.id}, function(err, client){
		if (err) return next(err);
		if (!client) return next(new Error('not found'));
		res.json(client);
	})
})
.delete(function(req, res, next){//delete client app
	OAuthClient.findOne({clientId: req.params.id}, function(err, client){
		if (err) return next(err);
		if (!client) return next(new Error('not found'));
		client.remove(function(err, deleted_client){
			if (err) return next(err);
			res.json(deleted_client);
		});
	})
});

module.exports = router