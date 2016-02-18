var zerror = require('./ZinfataError');


module.exports = function (){
	return function (err, req, res, next){

		if (err.name === 'CastError'){
			err = new zerror('not_found', 'Item not found');
		} else if(err.name === 'ValidationError') {
		    details  = '';
		    for(var key in err.errors) {
		      details += err.errors[key].message + '|';
		    };

		    details = details.replace(/Path/g, 'parameter');
		    err = new zerror('bad_param', details);
		}


		if (!(err instanceof zerror)) return next(err);
		

		if (err.headers) res.set(err.headers);
		delete err.headers;

		res.status(err.status).send(err);
	};
}