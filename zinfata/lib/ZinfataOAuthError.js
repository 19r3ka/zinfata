function ZinfataOAuthError(error, description) {
	this.name = 'OAuthError';
	

	this.headers = {
	    'Cache-Control': 'no-store',
	    'Pragma': 'no-cache'
    };

  switch (error) {
    case 'invalid_client':
      this.headers['WWW-Authenticate'] = 'Basic realm="Service"';
      /* falls through */
    case 'invalid_grant':
    case 'invalid_request':
      this.code = 400;
      break;
    case 'invalid_token':
      this.code = 401;
      break;
    case 'server_error':
      this.code = 503;
      break;
    default:
      this.code = 500;
  }
  this.error = error;
  this.error_description = description;
}

ZinfataOAuthError.prototype = Object.create(Error.prototype);

module.exports = ZinfataOAuthError;