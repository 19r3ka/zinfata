var config = {
	mail:  {
		service: 'gmail',
		auth: {
			user: 'noreplyzinfata@gmail.com',
			pass: 'ZfN#reply'		
		}
	},
	oauth2:  {
		model: require('../models/OAuth'),
		grants:['password', 'refresh_token'],
		accessTokenLifetime: 900, // 15 minutes
		refreshTokenLifetime: 604800 // 1 week
	},
	db: {
     	url: 'mongodb://localhost/zinfata'
	}, 

};

module.exports = config;

