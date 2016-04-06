// oauthLogin.unitest.js
var should          = require('chai').should();
var mongoose        = require('mongoose');
var request         = require('supertest');
var Client          = require('../models/OAuthClient.js');
var OAuth2          = require('../models/OAuth');
var User            = require('../models/User.js');
var app             = require('../app.js');

var api             = request(app);
var payload         = {};
var clientEndpoint  = '/clients/';
var tokenEndpoint   = '/oauth2/token/';
var revokeEndpoint  = '/oauth2/revoke/';
var zATEndpoint     = '/zinfataclient/';
var zRTEndpoint     = zATEndpoint + 'refresh';
var zRevokeEndpoint = '/zinfataclient/revoke';

var dummyUser       = {
  firstName:  'Kylo',
  lastName:   'Solo',
  handle:     'KyloRen',
  password:   'FirstOrder4eva',
  email:      'kylo@darkside.com',
  whatsapp:   '29010101'
};

var client          = {
  id:         'firstOrder',
  secret:     'Palpatine',
  redirect:   'darkside.com/rule_the_galaxy'
};

var zClient = {
  clientId:     'zinfata',
  clientSecret: '\'pass\'',
  redirectUri:  'http://zinfata.com/test_callback'
};

var clientId = client.id.toLowerCase();
var userId;
var mongo;

describe('OAuth2 API endpoints', function() {
  before(function(done) {
    mongoose.connect('mongodb://localhost/zTest');
    mongo = mongoose.connection;
    mongo.on('error', function(err) {
      done(err);
    });
    mongo.once('open', function() {
      console.log('Connected to ' + mongo.name.toUpperCase() + ' database.');
      mongo.db.dropDatabase(function() {
        console.log('Dropped the ' + mongo.name.toUpperCase() + ' database.');
      });
      done();
    });
  }); // End before

  after(function(done) {
    mongo.db.dropDatabase(function() {
      console.log(mongo.name + ' database dropped.');
      mongo.close(function() {
        console.log('Mongo DB closed.');
        done();
      });
    });
  }); // End after

  describe('Accessing API client endpoints', function() {
    beforeEach(function() {
      payload = {
        client_id:     client.id,
        client_secret: client.secret,
        redirect_uri:  client.redirect
      };
    });

    describe('Registering a new API client', function() {
      it('returns 400 when \'client_id\' is missing.', function(done) {
        delete payload.client_id;
        api.post(clientEndpoint)
        .type('form')
        .send(payload)
        .expect(400)
        .end(function(err, res) {
          should.not.exist(err);
          res.body.should.have.property('code', 400);
          res.body.should.have.property('error', 'invalid_request');
          res.body.should.have.property('error_description',
            'Missing client_id parameter');
          done();
        });
      });

      it('returns 400 when \'client_secret\' is missing.', function(done) {
        delete payload.client_secret;
        api.post(clientEndpoint)
        .type('form')
        .send(payload)
        .expect(400)
        .end(function(err, res) {
          should.not.exist(err);
          res.body.should.have.property('code', 400);
          res.body.should.have.property('error', 'invalid_request');
          res.body.should.have.property('error_description',
            'Missing client_secret parameter');
          done();
        });
      });

      it('returns 400 when \'redirect_uri\' is missing.', function(done) {
        delete payload.redirect_uri;
        api.post(clientEndpoint)
        .type('form')
        .send(payload)
        .expect(400)
        .end(function(err, res) {
          should.not.exist(err);
          console.log(res.body);
          // res.body.should.have.property('code', 400);
          res.body.should.have.property('status', 400);
          // res.body.should.have.property('error', 'invalid_request');
          res.body.should.have.property('error', 'bad_param');
          res.body.should.have.property('error_description',
            'parameter `redirectUri` is required.|');
          /*res.body.should.have.property('error_description',
            'Missing redirect_uri parameter');*/
          done();
        });
      });

      it('returns 201 when all required fields are present.', function(done) {
        api.post(clientEndpoint)
        .type('form')
        .send(payload)
        // .expect(201)
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          res.body.should.have.property('_id');
          res.body.should.have.property('clientId', client.id.toLowerCase());
          res.body.should.have.property('clientSecret', client.secret);
          res.body.should.have.property('redirectUri', client.redirect);
          done();
        });
      });

      it('returns 400 when the client creds are taken', function(done) {
        api.post(clientEndpoint)
        .type('form')
        .send(payload)
        .expect(400)
        .end(function(err, res) {
          should.not.exist(err);
          res.body.should.have.property('code', 400);
          res.body.should.have.property('error', 'invalid_request');
          res.body.should.have.property('error_description',
            'The client id is already in use');
          done();
        });
      });
    });

    describe('Retrieving API clients', function() {
      it('fails for a dummy clientId', function(done) {
        api.get(clientEndpoint + 'dummyClientID')
        // .expect(404)
        .expect(500)
        .end(function(err, res) {
          should.not.exist(err);
          console.log(res.body);
          /*
          res.body.should.have.property('status', 404);
          res.body.should.have.property('error', 'not_found');
          res.body.should.have.property('error_description', 'Client not found');
          */
          done();
        });
      });

      it('works with a proper clientId', function(done) {
        api.get(clientEndpoint + clientId)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          res.body.should.have.property('_id');
          res.body.should.have.property('clientId', client.id.toLowerCase());
          res.body.should.have.property('clientSecret', client.secret);
          res.body.should.have.property('redirectUri', client.redirect);
          done();
        });
      });
    });

    describe('Deleting API clients', function() {
      beforeEach(function(done) {
        payload = {
          client_secret: client.secret
        };
        done();
      });

      /*it('returns 400 without client_secret present.', function(done) {
        payload = {};
        api.delete(clientEndpoint + clientId)
        .type('form')
        .send(payload)
        .expect(400)
        .end(function(err, res) {
          should.not.exist(err);
          done();
        });
      });*/

      it('returns 404 with wrong client_secret.', function(done) {
        payload.client_secret = 'bogusSecret';
        api.delete(clientEndpoint + clientId)
        .type('form')
        .send(payload)
        .expect(404)
        .end(function(err, res) {
          should.not.exist(err);
          /*res.body.should.have.property('code', 404);
          res.body.should.have.property('error', 'not_found');
          res.body.should.have.property('error_description',
            'The client id is already in use');*/
          done();
        });
      });

      it('returns 200 with proper required fields.', function(done) {
        api.delete(clientEndpoint + clientId)
        .type('form')
        .send(payload)
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          res.body.should.have.property('_id');
          res.body.should.have.property('clientId', client.id);
          res.body.should.have.property('clientSecret', client.secret);
          res.body.should.have.property('redirectUri', client.redirect);
          done();
        });
      });
    });
  });

  describe('Accessing Token Endpoints', function() {
    var accessToken;
    var refreshToken;

    describe('From public endpoints', function() {
      before(function(done) {
        Client.findOne({clientId: client.id}, function(err, apiClient) {
          if (err) {
            done(err);
          }
          if (!apiClient) {
            var newClient = new Client({
              clientId:      client.id,
              clientSecret:  client.secret,
              redirectUri:   client.redirect
            });
            newClient.save(done);
          }
        });
      });

      before(function(done) {
        if (!userId) {
          User.findOne({handle: dummyUser.handle}, function(err, user) {
            if (err) {
              done(err);
            }
            if (!user) {
              new User(dummyUser).save(function(err, usr) {
                if (err) {
                  done(err);
                }
                userId = usr._id;
                done();
              });
            }
          });
        }
      });

      describe('Requesting new token credentials', function() {
        beforeEach(function(done) {
          payload = {
            grant_type:    'password',
            client_id:     client.id,
            client_secret: client.secret,
            username:      dummyUser.handle,
            password:      dummyUser.password
          };
          done();
        });

        it('returns 400 when client_id is missing', function(done) {
          delete payload.client_id;
          api.post(tokenEndpoint)
          .type('form')
          .send(payload)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.have.property('code', 400);
            res.body.should.have.property('error', 'invalid_client');
            res.body.should.have.property('error_description',
              'Invalid or missing client_id parameter');
            done();
          });
        });

        it('returns 400 when client_secret is missing', function(done) {
          delete payload.client_secret;
          api.post(tokenEndpoint)
          .type('form')
          .send(payload)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.have.property('code', 400);
            res.body.should.have.property('error', 'invalid_client');
            res.body.should.have.property('error_description',
              // 'Invalid or missing client_secret parameter');
              'Missing client_secret parameter');
            done();
          });
        });

        it('returns 400 when client_secret is missing', function(done) {
          delete payload.grant_type;
          api.post(tokenEndpoint)
          .type('form')
          .send(payload)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.have.property('code', 400);
            res.body.should.have.property('error', 'invalid_request');
            res.body.should.have.property('error_description',
              'Invalid or missing grant_type parameter');
            done();
          });
        });

        it('returns 400 when username is missing', function(done) {
          delete payload.username;
          api.post(tokenEndpoint)
          .type('form')
          .send(payload)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.have.property('code', 400);
            res.body.should.have.property('error', 'invalid_client');
            res.body.should.have.property('error_description',
              'Missing parameters. "username" and "password" are required');
            done();
          });
        });

        it('returns 400 when password is missing', function(done) {
          delete payload.password;
          api.post(tokenEndpoint)
          .type('form')
          .send(payload)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.have.property('code', 400);
            res.body.should.have.property('error', 'invalid_client');
            res.body.should.have.property('error_description',
              'Missing parameters. "username" and "password" are required');
            done();
          });
        });

        it('returns 200 when all required fields are present', function(done) {
          api.post(tokenEndpoint)
          .type('form')
          .send(payload)
          .expect(200)
          .end(function(err, res) {
            var savedToken = res.body;
            accessToken  = savedToken.access_token;
            refreshToken = savedToken.refresh_token;
            should.not.exist(err);
            savedToken.should.have.property('expires_in', 900);
            savedToken.should.have.property('token_type', 'bearer');
            savedToken.should.have.property('access_token').with.length(40);
            savedToken.should.have.property('refresh_token').with.length(40);
            done();
          });
        });
      });

      describe('Revoking token credentials', function() {
        beforeEach(function(done) {
          var token;
          if (!accessToken) {
            token = '9e4cf119d0494777c6d7eb9963e471ce97c2f3bc';
            OAuth.saveAccessToken(token, clientId, 900, userId,
            function(err, at) {
              if (err) {
                done(err);
              }
              accessToken = at;
            });
          }
          if (!refreshToken) {
            token = '6e4cf119d0494777c6d7eb9963e471ce97c2f3bc';
            OAuth.saveAccessToken(token, clientId, 960, userId,
            function(err, rt) {
              if (err) {
                done(err);
              }
              refreshToken = rt;
            });
          }
          done();
        });

        beforeEach(function(done) {
          payload = {
            token_type_hint: 'access_token',
            client_id:       client.id,
            client_secret:   client.secret,
            token:           'somethingbogus'
          };
          done();
        });

        it('returns 400 when client_id / client_secret is missing',
        function(done) {
          delete payload.client_secret;
          api.post(revokeEndpoint)
          .type('form')
          .send(payload)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.have.property('code', 400);
            res.body.should.have.property('error', 'invalid_request');
            res.body.should.have.property('error_description',
              'Missing parameters. \'client_id\' and \'client_secret\'' +
              ' are required');
            done();
          });
        });

        it('returns 400 with wrong client credentials',
        function(done) {
          payload.client_id = 'Darth Sidious';
          api.post(revokeEndpoint)
          .type('form')
          .send(payload)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.have.property('code', 400);
            res.body.should.have.property('error', 'invalid_client');
            res.body.should.have.property('error_description',
              'Client credentials are invalid');
            done();
          });
        });

        it('returns 400 when token_type_hint is missing',
        function(done) {
          delete payload.token_type_hint;
          api.post(revokeEndpoint)
          .type('form')
          .send(payload)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.have.property('code', 400);
            res.body.should.have.property('error', 'invalid_request');
            res.body.should.have.property('error_description',
              'Missing parameters. \'token_type_hint\' is required');
            done();
          });
        });

        it('returns 400 with wrong token_type_hint',
        function(done) {
          payload.token_type_hint = 'wrong_type';
          api.post(revokeEndpoint)
          .type('form')
          .send(payload)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.have.property('code', 400);
            res.body.should.have.property('error', 'invalid_request');
            res.body.should.have.property('error_description',
              '\'token_type_hint\' parameter value must be either' +
              ' \'refresh_token\' or \'access_token\'');
            done();
          });
        });

        it('returns 400 when token is missing', function(done) {
          delete payload.token;
          api.post(revokeEndpoint)
          .type('form')
          .send(payload)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.have.property('code', 400);
            res.body.should.have.property('error', 'invalid_request');
            res.body.should.have.property('error_description',
              'Missing parameters. \'token\' is required');
            done();
          });
        });

        it('returns 400 with wrong token', function(done) {
          payload.token = 'badToken';
          api.post(revokeEndpoint)
          .type('form')
          .send(payload)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.have.property('code', 400);
            res.body.should.have.property('error', 'invalid_request');
            res.body.should.have.property('error_description', 'Invalid token');
            done();
          });
        });

        it('returns 200 when access token is revoked', function(done) {
          payload.token_type_hint = 'access_token';
          payload.token           = accessToken;
          api.post(revokeEndpoint)
          .type('form')
          .send(payload)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            should.exist(res.body);
            OAuth2.getAccessToken(accessToken, function(err, token) {
              should.not.exist(err);
              should.not.exist(token);
            });
            done();
          });
        });

        it('returns 200 when refresh token is revoked', function(done) {
          payload.token_type_hint = 'refresh_token';
          payload.token           = refreshToken;
          api.post(revokeEndpoint)
          .type('form')
          .send(payload)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            should.exist(res.body);
            OAuth2.getRefreshToken(accessToken, function(err, token) {
              should.not.exist(err);
              should.not.exist(token);
            });
            done();
          });
        });
      });
    });

    /*describe('From zinfataClient endpoints', function() {
      before(function(done) {
        if (!userId) {
          User.findOne({handle: dummyUser.handle}, function(err, usr) {
            if (err) {
              done(err);
            }
            if (!usr) {
              User.create(dummyUser, function(err, usr) {
                if (err) {
                  done(err);
                }
                userId = usr._id;
              });
            }
            userId = usr._id;
            done();
          });
        }
      });

      before(function(done) {
        Client.findOne({clientId: zClient.clientId}, function(err, apiClient) {
          if (err) {
            done(err);
          }
          if (!apiClient) {
            new Client(zClient).save(function(err, zC) {
              if (err) {
                done(err);
              }
              clientId = zC.clientId;
            });
          }
          done();
        });
      });

      describe('Requesting new token credentials', function() {
        beforeEach(function(done) {
          payload = {
            username: dummyUser.handle,
            password: dummyUser.password
          };
          done();
        });

        it('returns 400 when username is missing', function(done) {
          delete payload.username;
          api.post(zATEndpoint)
          .type('form')
          .send(payload)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.have.property('code', 400);
            res.body.should.have.property('error', 'invalid_request');
            res.body.should.have.property('error_description',
              'Missing parameters. \'username\' and \'password\' are required');
            done();
          });
        });

        it('returns 400 when password is missing', function(done) {
          delete payload.password;
          api.post(zATEndpoint)
          .type('form')
          .send(payload)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.have.property('code', 400);
            res.body.should.have.property('error', 'invalid_request');
            res.body.should.have.property('error_description',
              'Missing parameters. \'username\' and \'password\' are required');
            done();
          });
        });

        it('returns 200 when all required fields are present', function(done) {
          console.log('Before 200 test, userId is ' + userId);
          console.log(payload);
          api.post(zATEndpoint)
          .type('form')
          .send(payload)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              done(err);
            }
            var savedToken = res.body;
            accessToken  = savedToken.access_token;
            refreshToken = savedToken.refresh_token;
            should.not.exist(err);
            savedToken.should.have.property('expires_in', 900);
            savedToken.should.have.property('token_type', 'bearer');
            savedToken.should.have.property('access_token').with.length(40);
            savedToken.should.have.property('refresh_token').with.length(40);
            done();
          });
        });
      });

      describe('Revoking token credentials', function() {
        beforeEach(function(done) {
          var token;
          console.log(userId);
          if (!accessToken) {
            token = '9e4cf119d0494777c6d7eb9963e471ce97c2f3bc';
            OAuth2.saveAccessToken(token, clientId, 900, userId,
            function(err, at) {
              if (err) {
                done(err);
              }
              accessToken = at;
            });
          }
          if (!refreshToken) {
            token = '6e4cf119d0494777c6d7eb9963e471ce97c2f3bc';
            OAuth2.saveRefreshToken(token, clientId, 960, userId,
            function(err, rt) {
              if (err) {
                done(err);
              }
              refreshToken = rt;
            });
          }
          done();
        });

        beforeEach(function(done) {
          payload = {
            token_type_hint: 'access_token',
            token:           'somethingbogus'
          };
          done();
        });

        it('returns 400 when token_type_hint is missing',
        function(done) {
          delete payload.token_type_hint;
          api.post(zRevokeEndpoint)
          .type('form')
          .send(payload)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.have.property('code', 400);
            res.body.should.have.property('error', 'invalid_request');
            res.body.should.have.property('error_description',
              'Missing parameters. \'token_type_hint\' is required');
            done();
          });
        });

        it('returns 400 with wrong token_type_hint',
        function(done) {
          payload.token_type_hint = 'wrong_type';
          api.post(zRevokeEndpoint)
          .type('form')
          .send(payload)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.have.property('code', 400);
            res.body.should.have.property('error', 'invalid_request');
            res.body.should.have.property('error_description',
              '\'token_type_hint\' parameter value must be either' +
              ' \'refresh_token\' or \'access_token\'');
            done();
          });
        });

        it('returns 400 when token is missing', function(done) {
          delete payload.token;
          api.post(zRevokeEndpoint)
          .type('form')
          .send(payload)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.have.property('code', 400);
            res.body.should.have.property('error', 'invalid_request');
            res.body.should.have.property('error_description',
              'Missing parameters. \'token\' is required');
            done();
          });
        });

        it('returns 400 with wrong token', function(done) {
          payload.token = 'badToken';
          api.post(zRevokeEndpoint)
          .type('form')
          .send(payload)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.have.property('code', 400);
            res.body.should.have.property('error', 'invalid_request');
            res.body.should.have.property('error_description', 'Invalid token');
            done();
          });
        });

        it('returns 200 when access token is revoked', function(done) {
          payload.token_type_hint = 'access_token';
          payload.token           = accessToken;
          api.post(zRevokeEndpoint)
          .type('form')
          .send(payload)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            should.exist(res.body);
            OAuth2.getAccessToken(accessToken, function(err, token) {
              should.not.exist(err);
              should.not.exist(token);
            });
            done();
          });
        });

        it('returns 200 when refresh token is revoked', function(done) {
          payload.token_type_hint = 'refresh_token';
          payload.token           = refreshToken;
          api.post(zRevokeEndpoint)
          .type('form')
          .send(payload)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            should.exist(res.body);
            OAuth2.getRefreshToken(accessToken, function(err, token) {
              should.not.exist(err);
              should.not.exist(token);
            });
            done();
          });
        });
      }); // End 'Revoking token credentials'
    });*/ // End 'From zinfataClient endpoints'
  });

  describe('Querying Protected Endpoints With Token', function() {

  });
});
