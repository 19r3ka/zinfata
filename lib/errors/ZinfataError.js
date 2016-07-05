function ZinfataError(error, description) {
	//this.name = 'ZinfataError';
	this.headers = {
	    'Cache-Control': 'no-store',
	    'Pragma': 'no-cache'
    };

    switch(error) {
    	case 'invalid_request':
    	case 'bad_param':
    		this.status = 400;
    		break;
    	case 'forbidden':
    		this.status = 403;
    		break;
    	case 'not_found':
    		this.status = 404;
    		break;
    	case 'server_error':
    	default:
    		this.status = 500;
    }

    this.error = error;

    if (this.status === 403 && !description) {
        this.error_description = 'You do not have access to the requested resource!';
    } else {
  	    this.error_description = description;
    }
}

ZinfataError.prototype = Object.create(Error.prototype);

module.exports = ZinfataError;

/*
400 	Bad Request 	[RFC7231, Section 6.5.1]
401 	Unauthorized 	[RFC7235, Section 3.1]
403 	Forbidden 	[RFC7231, Section 6.5.3]
404 	Not Found 	[RFC7231, Section 6.5.4]
500 	Internal Server Error 	[RFC7231, Section 6.6.1]
*/

