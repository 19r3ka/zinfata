var should   = require('chai').should();
var request  = require('supertest');
var mongoose = require('mongoose');
var User     = require('../models/User.js');
var Oauth2   = require('../models/OAuthAccessToken.js');
var Client   = require('../models/OAuthClient.js');
var app      = require('../app.js');
var api      = request(app);

var endpoint = '/api/users/';
var payload  = {};
var defaultUrl  = 'zinfataClient/assets/images/user-avatar-placeholder.png';
var userId;
var query;
var oauthToken;
var mongo;

var apiClient = {
  clientId:     'thisIsMyClientsIdForMyCoolApp',
  clientSecret: 'thisIsSomethingAbsolutelyDarkAndSecret',
  redirectUri:  'http://www.myapp.com'
};

describe('Querying the api users endpoints', function() {
  before(function(done) {
    mongoose.connect('mongodb://localhost/zTest');
    mongo = mongoose.connection;
    mongo.once('open', function() {
      console.log('Connected to zTest database.');
      mongo.db.dropDatabase(function() {
        console.log('Dropped the zTest database.');
        done();
      });
    });
  });

  after(function(done) {
    mongo.db.dropDatabase(function() {
      console.log('zTest Database dropped.');
      mongo.close(function() {
        console.log('Mongo DB close.');
        done();
      });
    });
  });

  describe('POSTing', function() {
    beforeEach(function() {
      payload  = {
        firstName:  'Snoop',
        lastName:   'Dogg',
        handle:     'DoggFather',
        email:      'snoop@dogpound.com',
        password:   'Ku5h@ndB!unt'
      };
    });

    it('returns 400 when \'firstName\' is missing', function(done) {
      delete payload.firstName;
      api.post(endpoint)
      .type('form')
      .send(payload)
      .expect(400)
      .end(function(err, res) {
        if (err) {
          done(err);
        }
        res.body.should.have.property('status', 400);
        res.body.should.have.property('error', 'bad_param');
        res.body.should.have.property('error_description',
          'parameter `firstName` is required.|');
        done();
      });
    });

    it('returns 400 when \'lastName\' is missing', function(done) {
      delete payload.lastName;
      api.post(endpoint)
      .type('form')
      .send(payload)
      .expect(400)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.should.have.property('status', 400);
        res.body.should.have.property('error', 'bad_param');
        res.body.should.have.property('error_description',
          'parameter `lastName` is required.|');
        done();
      });
    });

    it('returns 400 when \'handle\' is missing', function(done) {
      delete payload.handle;
      api.post(endpoint)
      .type('form')
      .send(payload)
      .expect(400)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.should.have.property('status', 400);
        res.body.should.have.property('error', 'bad_param');
        res.body.should.have.property('error_description',
          'parameter `handle` is required.|');
        done();
      });
    });

    it('returns 400 when \'email\' is missing', function(done) {
      delete payload.email;
      api.post(endpoint)
      .type('form')
      .send(payload)
      .expect(400)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.should.have.property('status', 400);
        res.body.should.have.property('error', 'bad_param');
        res.body.should.have.property('error_description',
           'parameter `email` is required.|');
        done();
      });
    });

    it('returns 400 when \'password\' is missing', function(done) {
      delete payload.password;
      api.post(endpoint)
      .type('form')
      .send(payload)
      .expect(400)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.should.have.property('status', 400);
        res.body.should.have.property('error', 'bad_param');
        res.body.should.have.property('error_description',
           'parameter `password` is required.|');
        done();
      });
    });

    it('returns 400 when \'handle\' and \'email\' are missing', function(done) {
      delete payload.handle;
      delete payload.email;
      api.post(endpoint)
      .type('form')
      .send(payload)
      .expect(400)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.should.have.property('status', 400);
        res.body.should.have.property('error', 'bad_param');
        res.body.should.have.property('error_description',
          'parameter `email` is required.|parameter `handle` is required.|');
        done();
      });
    });

    it('returns 201 when user creation was successful', function(done) {
      this.timeout(25000);
      api.post(endpoint)
      .type('form')
      .send(payload)
      .expect(201)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        // console.log(res.body);
        userId = res.body._id;
        res.body.should.have.property('firstName', payload.firstName);
        res.body.should.have.property('lastName', payload.lastName);
        res.body.should.have.property('handle', payload.handle);
        res.body.should.have.property('whatsapp', '');
        res.body.should.have.property('updatedAt');
        res.body.should.have.property('_id');
        res.body.should.have.property('avatarUrl');
        res.body.should.have.property('role', 'fan');
        res.body.should.not.have.property('password');
        res.body.should.not.have.property('firstNameLower');
        res.body.should.not.have.property('lastNameLower');
        res.body.should.not.have.property('handleLower');
        res.body.should.not.have.property('email');
        res.body.should.not.have.property('deleted');
        res.body.should.not.have.property('activated');
        done();
      });
    });

    it('returns 400 when the user already exists', function(done) {
      api.post(endpoint)
      .type('form')
      .send(payload)
      .expect(400)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.should.have.property('status', 400);
        res.body.should.have.property('error', 'bad_param');
        res.body.should.have.property('error_description',
          'handle is already in use');
        done();
      });
    });
  });

  describe('/PuTing', function() {
    before(function(done) {
      var token = 'thisIsMyPublicToken';
      var oauth2Client = new Client(apiClient);
      oauth2Client.save(function(err, client) {
        if (err) {
          done(err);
        }
        Oauth2.saveAccessToken(token, client.clientId, 9000, userId,
          function(err, token) {
            if (err) {
              done(err);
            }
            oauthToken = token;
            console.log(token);
            done();
          });
      });
    });
    /*
    it('fails without a proper Oauth2 token', function(done) {
      api.put(endpoint + userId)
      .send({firstName: 'Nate'})
      .expect(401)
      .end(function(err, res) {
        if (err) {
          done(err);
        }
        console.log(res.body);
        done();
      });
    });

    it('fails when trying to update some other user', function(done) {

    });*/
    it('changes the user\'s firstName from Snoop to Nate', function(done) {
      api.put(endpoint + userId)
      .send({firstName: 'Nate'})
      .expect(200)
      .end(function(err, res) {
        if (err) {
          done(err);
        }
        res.body.should.have.property('firstName', 'Nate');
        res.body.should.have.property('lastName', payload.lastName);
        res.body.should.have.property('handle', payload.handle);
        res.body.should.have.property('updatedAt');
        res.body.should.have.property('_id');
        res.body.should.have.property('role', 'fan');
        res.body.should.have.property('avatarUrl');
        res.body.should.not.have.property('firstNameLower');
        res.body.should.not.have.property('lastNameLower');
        res.body.should.not.have.property('handleLower');
        res.body.should.not.have.property('email');
        res.body.should.not.have.property('password');
        res.body.should.not.have.property('activated');
        res.body.should.not.have.property('deleted');

        done();
      });
    });
  });

  describe('/GETing', function() {
    it('retrieves the user by id', function(done) {
      api.get(endpoint + userId)
      .expect(200)
      .end(function(err, res) {
        if (err) {
          done(err);
        }
        res.body.should.have.property('firstName', 'Nate');
        res.body.should.have.property('lastName', payload.lastName);
        res.body.should.have.property('handle', payload.handle);
        res.body.should.have.property('updatedAt');
        res.body.should.have.property('_id');
        res.body.should.have.property('role', 'fan');
        res.body.should.have.property('avatarUrl');
        res.body.should.not.have.property('firstNameLower');
        res.body.should.not.have.property('lastNameLower');
        res.body.should.not.have.property('handleLower');
        res.body.should.not.have.property('email');
        res.body.should.not.have.property('password');
        res.body.should.not.have.property('activated');
        res.body.should.not.have.property('deleted');

        done();
      });
    });

    it('retrieves the user by handle', function(done) {
      api.get(endpoint + 'handle/' + payload.handle)
      .expect(200)
      .end(function(err, res) {
        if (err) {
          done(err);
        }
        res.body.should.have.property('firstName', 'Nate');
        res.body.should.have.property('lastName', payload.lastName);
        res.body.should.have.property('handle', payload.handle);
        res.body.should.have.property('updatedAt');
        res.body.should.have.property('_id');
        res.body.should.have.property('role', 'fan');
        res.body.should.have.property('avatarUrl');
        res.body.should.not.have.property('firstNameLower');
        res.body.should.not.have.property('lastNameLower');
        res.body.should.not.have.property('handleLower');
        res.body.should.not.have.property('email');
        res.body.should.not.have.property('password');
        res.body.should.not.have.property('activated');
        res.body.should.not.have.property('deleted');
        done();
      });
    });
  });

  describe('/DELETEing', function() {
    it('removes by ID', function(done) {
      api.delete(endpoint + userId)
      .send({})
      .expect(200)
      .end(function(err, res) {
        if (err) {
          done(err);
        }
        res.body.should.have.property('firstName', 'Nate');
        res.body.should.have.property('lastName', payload.lastName);
        res.body.should.have.property('handle', payload.handle);
        res.body.should.have.property('updatedAt');
        res.body.should.have.property('_id');
        res.body.should.have.property('role', 'fan');
        res.body.should.have.property('avatarUrl');
        res.body.should.not.have.property('firstNameLower');
        res.body.should.not.have.property('lastNameLower');
        res.body.should.not.have.property('handleLower');
        res.body.should.not.have.property('email');
        res.body.should.not.have.property('password');
        res.body.should.not.have.property('activated');
        res.body.should.not.have.property('deleted');
        done();
      });
    });

    it('shouldn\'t get deleted users', function(done) {
      api.get(endpoint + userId)
      .expect(404)
      .end(function(err, res) {
        if (err) {
          done(err);
        }
        res.body.should.have.property('status', 404);
        res.body.should.have.property('error', 'not_found');
        res.body.should.have.property('error_description', 'User not found');

        done();
      });
    });
  });
});
