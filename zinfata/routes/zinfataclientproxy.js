var express  = require('express');
var router   = express.Router();

var httpProxy = require('http-proxy'); 
var proxy = httpProxy.createProxyServer();


router.post('/', function(req, res, next){
	//req.body.grant_type = 'password';
	//console.log(req.body);
	proxy.web(req, res, {target: 'http://localhost:3000/oauth2/token'})
});


module.exports = router;