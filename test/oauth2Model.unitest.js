var should      = require('chai').should();
var mongoose    = require('mongoose');
var Oauth2      = require('../models/OAuth.js');
var OAuthClient = require('../models/OAuthClient.js');
var User        = require('../models/User.js');

var dummyUser = {
  firstName:  'modeste',
  lastName:   'rebel',
  handle:     'test',
  password:   'password',
  email:      'mail@gmail.com',
  whatsapp:   '29010101'
};
var client    = {
  id:         'zinfata',
  secret:     '\'pass\'',
  redirect:   'http://backtomysite.com/get_token'
};

var payload   = {};
var token     = 'mySuperGreatToken';
var expires   = 9600;
var clientId;
var userId;
var mongo;

describe('Authenticating Users', function() {
  before(function(done) {
    mongo = mongoose.createConnection('mongodb://localhost/zTest');
    mongo.once('open', function() {
      console.log('Connected to ' + mongo.name.toUpperCase() + ' database.');
      mongo.db.dropDatabase(function() {
        console.log('Dropped the ' + mongo.name.toUpperCase() + ' database.');
        done();
      });
    });
  });

  after(function(done) {
    mongo.db.dropDatabase(function() {
      console.log(mongo.name + ' Database dropped.');
      mongo.close(function() {
        console.log('Mongo DB closed.');
        done();
      });
    });
  });

  before(function(done) {
    payload = {
      clientId:     client.id,
      clientSecret: client.secret,
      redirectUri:  client.redirect
    };
    var client2save = new OAuthClient(payload);
    client2save.save(function(err, savedClient) {
      if (err) {
        return done(err);
      }
      if (savedClient) {
        clientId = savedClient.clientId;
        console.log('New API client created.');
      }
      done();
    });
  });

  before(function(done) {
    var u = new User(dummyUser);
    u.save(dummyUser, function(err, savedUser) {
      if (err) {
        return done(err);
      }
      if (savedUser) {
        userId = savedUser._id;
        console.log('New user created.');
      }
      done();
    });
  });

  describe('Handling Access Tokens', function() {
    describe('Saving an access token', function() {
      it('fails when token is missing/wrong.', function(done) {
        Oauth2.saveAccessToken('', clientId, expires, userId,
          function(err, savedToken) {
          err.should.exist;
          console.log(err.errors);
          err.errors.should.have.property('accessToken');
          should.not.exist(savedToken);
          done();
        });
      });

      it('fails when API client ID is missing/wrong.', function(done) {
        Oauth2.saveAccessToken(token, '', expires, userId,
        function(err, savedToken) {
          err.should.exist;
          err.errors.should.have.property('clientId');
          should.not.exist(savedToken);
          done();
        });
      });

      it('fails when \'expires\' field is missing/wrong.', function(done) {
        Oauth2.saveAccessToken(token, clientId, '', userId,
        function(err, savedToken) {
          err.should.exist;
          err.errors.should.have.property('expires');
          should.not.exist(savedToken);
          done();
        });
      });

      it('fails when API client ID is missing/wrong.', function(done) {
        Oauth2.saveAccessToken(token, clientId, expires, '',
        function(err, savedToken) {
          err.should.exist;
          err.errors.should.have.property('userId');
          should.not.exist(savedToken);
          done();
        });
      });

      it('works with all required fields.', function(done) {
        Oauth2.saveAccessToken(token, clientId, expires, userId,
        function(err, savedToken) {
          should.not.exist(err);
          savedToken.should.have.property('userId', userId);
          savedToken.should.have.property('clientId', client.id);
          savedToken.should.have.property('accessToken', token.toLowerCase());
          savedToken.should.have.property('expires');
          savedToken.should.have.property('_id');
          done();
        });
      });
    });

    describe('Retrieving an access token', function() {
      it('fails when access token is wrong/missing.', function(done) {
        Oauth2.getAccessToken('bogusAccessToken', function(err, accessToken) {
          console.log(err);
          console.log(accessToken);
          should.not.exist(accessToken);
          done();
        });
      });

      it('works when access token is present.', function(done) {
        Oauth2.getAccessToken(token.toLowerCase(), function(err, accessToken) {
          should.not.exist(err);
          accessToken.should.have.property('clientId', client.id);
          accessToken.should.have.property('accessToken', token.toLowerCase());
          accessToken.should.have.property('userId');
          accessToken.should.have.property('expires');
          accessToken.should.have.property('_id');
          done();
        });
      });
    });
  });

  describe('Handling Refresh Tokens', function() {
    describe('Saving a refresh token', function() {
      it('fails when token is missing/wrong.', function(done) {
        Oauth2.saveRefreshToken('', clientId, expires, userId,
          function(err, savedToken) {
          err.should.exist;
          err.errors.should.have.property('refreshToken');
          should.not.exist(savedToken);
          done();
        });
      });

      it('fails when API client ID is missing/wrong.', function(done) {
        Oauth2.saveRefreshToken(token, '', expires, userId,
        function(err, savedToken) {
          err.should.exist;
          err.errors.should.have.property('clientId');
          should.not.exist(savedToken);
          done();
        });
      });

      it('fails when \'expires\' field is missing/wrong.', function(done) {
        Oauth2.saveRefreshToken(token, clientId, '', userId,
        function(err, savedToken) {
          err.should.exist;
          err.errors.should.have.property('expires');
          should.not.exist(savedToken);
          done();
        });
      });

      it('fails when API client ID is missing/wrong.', function(done) {
        Oauth2.saveRefreshToken(token, clientId, expires, '',
        function(err, savedToken) {
          err.should.exist;
          err.errors.should.have.property('userId');
          should.not.exist(savedToken);
          done();
        });
      });

      it('works with all required fields.', function(done) {
        Oauth2.saveRefreshToken(token, clientId, expires, userId,
        function(err, savedToken) {
          console.log(err);
          should.not.exist(err);
          savedToken.should.have.property('userId', userId);
          savedToken.should.have.property('clientId', client.id);
          savedToken.should.have.property('refreshToken', token.toLowerCase());
          savedToken.should.have.property('expires');
          savedToken.should.have.property('_id');
          done();
        });
      });
    });

    describe('Retrieving a refresh token', function() {
      it('fails when refresh token is wrong/missing.', function(done) {
        Oauth2.getRefreshToken('bogusRefreshToken',
        function(err, refreshToken) {
          should.not.exist(refreshToken);
          done();
        });
      });

      it('works when refresh token is present.', function(done) {
        Oauth2.getRefreshToken(token.toLowerCase(),
        function(err, refreshToken) {
          should.not.exist(err);
          refreshToken.should.have.property('clientId', client.id);
          refreshToken.should.have.property('refreshToken',
            token.toLowerCase());
          refreshToken.should.have.property('userId');
          refreshToken.should.have.property('expires');
          refreshToken.should.have.property('_id');
          done();
        });
      });
    });

    describe('Revoking a refresh token', function() {
      it('fails when refresh token is wrong/missing.', function(done) {
        Oauth2.revokeRefreshToken('bogusRefreshToken',
        function(err, refreshToken) {
          should.not.exist(err);
          should.not.exist(refreshToken);
          done();
        });
      });

      it('works when refresh token is present.', function(done) {
        Oauth2.revokeRefreshToken(token.toLowerCase(),
        function(err, refreshToken) {
          should.not.exist(err);
          refreshToken.should.have.property('clientId', client.id);
          refreshToken.should.have.property('refreshToken',
            token.toLowerCase());
          refreshToken.should.have.property('userId');
          refreshToken.should.have.property('expires');
          refreshToken.should.have.property('_id');
          done();
        });
      });
    });
  });

  describe('Handling API Clients', function() {
    it('finds an API client with only its clientId.', function(done) {
      Oauth2.getClient(clientId, null, function(err, APIclient) {
        should.not.exist(err);
        APIclient.should.have.property('clientId', client.id);
        APIclient.should.have.property('clientSecret', client.secret);
        APIclient.should.have.property('redirectUri', client.redirect);
        done();
      });
    });

    it('finds an API client from clientId and clientSecret.',
    function(done) {
      Oauth2.getClient(clientId, client.secret, function(err, APIclient) {
        should.not.exist(err);
        APIclient.should.have.property('clientId', client.id);
        APIclient.should.have.property('clientSecret', client.secret);
        APIclient.should.have.property('redirectUri', client.redirect);
        done();
      });
    });

    it('fails with bad clientId / clientSecret combination.', function(done) {
      Oauth2.getClient(clientId, 'bogusSecret', function(err, APIclient) {
        should.not.exist(APIclient);
        // should.exist(err);
        done();
      });
    });
  });

  describe('Handling Authenticated Users', function() {
    
  });
});
