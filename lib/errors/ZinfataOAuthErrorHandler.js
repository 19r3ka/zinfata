var ZError = require('./ZinfataOAuthError');

module.exports = function (){
	return function (err, req, res, next){
		if (!(err instanceof ZError)) return next(err);
		
		delete err.name;

		if (err.headers) res.set(err.headers);
		delete err.headers;

		res.status(err.code).send(err);

	};
}