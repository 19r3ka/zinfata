var express  = require('express');
var request  = require('request');
var router   = express.Router();
//var utils   = require('./../bin/utils');

router.post('/', function(req, res, next){
    //utils.checkIsValidPost(req, next);
    if (!req.is('application/x-www-form-urlencoded'))  {
		var error = new Error();
		error.status = 400;
		error.error_description = 'Method must be POST with application/x-www-form-urlencoded encoding';
		error.error = 'invalid_request';
		return next(error); 
	}

	if (!req.body.username || !req.body.password)  {
		var error = new Error();
		error.status = 400;
		error.error_description = 'Missing parameters. \'username\' and \'password\' are required';
		error.error = 'invalid_request';
		return next(error); 
	}
	//proxy.web(req, res, {target: 'http://localhost:3000/oauth2/token'})
	request.post({url: 'http://localhost:3000/oauth2/token',form: {username: req.body.username, password: req.body.password ,grant_type:'password',client_id: 'zinfata', client_secret: "'pass'"}},
		function(err, httpResp, body){
			if (err) return next(err);
			res.json(JSON.parse(body));
	});

});


router.post('/refresh', function(req, res, next){
	//utils.checkIsValidPost(req, next);
	if (!req.is('application/x-www-form-urlencoded'))  {
		var error = new Error();
		error.status = 400;
		error.error_description = 'Method must be POST with application/x-www-form-urlencoded encoding';
		error.error = 'invalid_request';
		return next(error); 
	}

	if (!req.body.refresh_token){
		var error = new Error();
		error.status = 400;
		error.error_description = 'Missing parameters. \'refresh_token\' is required';
		error.error = 'invalid_request';
		return next(error); 	
	}

	request.post({url: 'http://localhost:3000/oauth2/token',form: {refresh_token: req.body.refresh_token,grant_type:'refresh_token',client_id: 'zinfata', client_secret: "'pass'"}},
	function(err, httpResp, body){
		if (err) return next(err);
		//res.json(JSON.parse(body));
		res.send(JSON.parse(body));
	});

});

router.post('/revoke', function(req, res, next){
	//utils.checkIsValidPost(req, next);
	if (!req.is('application/x-www-form-urlencoded'))  {
		var error = new Error();
		error.status = 400;
		error.error_description = 'Method must be POST with application/x-www-form-urlencoded encoding';
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

	//if (!req.body.token_type_hint.match('refresh_token|acces_token')) {
	if ( req.body.token_type_hint != 'refresh_token' && req.body.token_type_hint != 'access_token') {
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
	var token_type_hint = req.body.token_type_hint;
	var token = req.body.token;

	request.post({url: 'http://localhost:3000/oauth2/revoke',form: {token_type_hint: token_type_hint,token: token,client_id: 'zinfata', client_secret: "'pass'"}},
	function(err, httpResp, body){
		if (err) return next(err);
		res.send(body);
	});

});


module.exports = router;