var config = {
  mail:  {
    service: 'gmail',
    auth: {
      user: 'noreplyzinfata@gmail.com',
      pass: 'ZfN#reply'
    }
  },
  oauth2:  {
    model:                require('../models/OAuth'),
    grants:               ['password', 'refresh_token'],
    accessTokenLifetime:  900, // 15 minutes
    refreshTokenLifetime: 604800 // 1 week
  },
  db: {
    url: 'mongodb://localhost/zinfata'
  },
  soundcloud: {
    clientId:     'b39e79a16b423a983a9cd7c9c962f41b',
    clientSecret: '557ed0cca3afa87e336168cc7ceb8f24',
    username:     'zinfata@gmail.com',
    password:     'Zinf47a@Soundc10ud'
  },
  development: {
    host: 'http://localhost',
    port: 3000,
    db: {
      url: 'mongodb://localhost/zinfata'
    }
  },
  production: {
    host: 'XXXXXX',
    port: 'XXXXXX'
  }
};

module.exports = config;
