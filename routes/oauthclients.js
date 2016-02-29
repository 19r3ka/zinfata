module.exports = function(wagner){

	var OAuthClientModel, zerror;
	wagner.invoke(function(ZOAuthError, OAuthClient){
		OAuthClientModel = OAuthClient;
		zerror = ZOAuthError;
	});
	var OAuthClient = OAuthClientModel

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

		if (!req.is('application/x-www-form-urlencoded'))  {
			var error = new zerror('invalid_request', 'Method must be POST with application/x-www-form-urlencoded encoding');
			return next(error); 
		}
		var data = req.body;
		if (!data.client_id || !data.client_secret) {
			var error_description = !data.client_id ? 'Missing client_id parameter' :  'Missing client_secret parameter';
			var err = new zerror('invalid_request', error_description);
			return next(err);
		}

		new_client = new OAuthClient({
			clientId: data.client_id,
		 	clientSecret: data.client_secret,
		 	redirectUri: data.redirect_uri
		});
		new_client.save(function(err, client){
			if (err) {
				if (err.code == 11000) {
					var err = new zerror('invalid_request', 'The client id is already in use');
		    		return next(err);
				}
				return next(err);
			}
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

	return router;
}
