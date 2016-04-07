var should   = require('chai').should();
var mongoose = require('mongoose');

var userId;
var payload  = {};
var dummyUser1 = {
  firstName:  'Matt',
  lastName:   'Murdock',
  handle:     'DareDevil',
  email:      'Fearless@devilskitchen.fr',
  password:   'qwertyui'
};

/* API Testing Configuration Supplement Files*/
var request  = require('supertest');
var Oauth2   = require('../models/OAuthAccessToken.js');
var Client   = require('../models/OAuthClient.js');
var app      = require('../app.js');
var api      = request(app);

var dummyUser2 = {
  firstName:  'Tony',
  lastName:   'Stark',
  handle:     'IronMan',
  email:      'flashymillionaire@starksco.tg',
  password:   'qwertyui'
};

var fakeApp = {
  clientId:     'thisismysupercoolclientid',
  clientSecret: 'thisIsSomethingAbsolutelyDarkAndSecret',
  redirectUri:  'http://www.myapp.com'
};
var mongo;
var clientId;
var token;
var token2;

var saveTkn  = '/oauth2/token/';

/*Test Specific Variables */
var endpoint = '/api/playlists/';

var User     = require('../models/User.js');
var Playlist = require('../models/Playlist.js');
var playlistId;
var playlist2Id;

describe('Working With Playlist Endpoints', function() {
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

  before(function(done) {
    User.create(dummyUser1, function(err, usr) {
      if (err) {
        done(err);
      }
      if (usr) {
        userId = usr._id.toString();
      }
      done();
    });
  }); // End before

  before(function(done) {
    Client.create(fakeApp, function(err, fapp) {
      if (err) {
        done(err);
      }
      if (fapp) {
        clientId = fapp.clientId;
      }
      done();
    });
  }); // End before

  before(function(done) {
    payload = {
      grant_type:    'password',
      client_id:     fakeApp.clientId,
      client_secret: fakeApp.clientSecret,
      username:      dummyUser1.handle,
      password:      dummyUser1.password
    };
    api.post(saveTkn)
    .type('form')
    .send(payload)
    .expect(200)
    .end(function(err, res) {
      var savedToken = res.body;
      token = savedToken.access_token;
      done();
    });
  });

  after(function(done) {
    mongo.db.dropDatabase(function() {
      console.log(mongo.name + ' database dropped.');
      mongo.close(function() {
        console.log('Mongo DB closed.');
        done();
      });
    });
  }); // End after

  describe('Accessing endpoints with/without valid bearer token', function() {
    it('returns 400 without access token is header', function(done) {
      api.get(endpoint)
      .type('form')
      .expect(400)
      .end(function(err, res) {
        should.not.exist(err);
        res.body.should.have.property('code', 400);
        res.body.should.have.property('error', 'invalid_request');
        res.body.should.have.property('error_description',
          'The access token was not found');
        done();
      });
    }); // END returns 400 without accesstoken in header

    it('returns 400 with malformed bearer token', function(done) {
      api.get(endpoint)
      .type('form')
      .set('Authorization', 'bearer ' + token)
      .expect(400)
      .end(function(err, res) {
        should.not.exist(err);
        res.body.should.have.property('code', 400);
        res.body.should.have.property('error', 'invalid_request');
        res.body.should.have.property('error_description',
          'Malformed auth header');
        done();
      });
    }); //END when title is missing

    it('returns 401 with invalid bearer token', function(done) {
      api.get(endpoint)
      .type('form')
      .set('Authorization', 'Bearer 5703d23005g65c2f479e2Y3m')
      .expect(401)
      .end(function(err, res) {
        should.not.exist(err);
        res.body.should.have.property('code', 401);
        res.body.should.have.property('error', 'invalid_token');
        res.body.should.have.property('error_description',
          'The access token provided is invalid.');
        done();
      });
    }); //END when title is missing

    it('returns 200 when the bearer token is valid', function(done) {
      api.get(endpoint)
      .type('form')
      .set('Authorization', 'Bearer ' + token)
      .expect(404)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        done();
      });
    }); //END 'returns 400 when bearer token valid'
  }); // END 'testing access token in header'

  describe('POSTing New Playlist', function() {
    beforeEach(function(done) {
      payload = {
        title:   'Uncanny Xmen',
        ownerId: userId
      };
      done();
    });

    it('returns 400 when title is missing', function(done) {
      delete payload.title;
      api.post(endpoint)
      .type('form')
      .set('Authorization', 'Bearer ' + token)
      .send(payload)
      .expect(400)
      .end(function(err, res) {
        if (err) {
          done(err);
        }
        res.body.should.have.property('status', 400);
        res.body.should.have.property('error', 'bad_param');
        res.body.should.have.property('error_description',
          'parameter `title` is required.|');
        done();
      });
    }); // - fails when missing title

    it('returns 400 when ownerId is missing', function(done) {
      delete payload.ownerId;
      api.post(endpoint)
      .type('form')
      .set('Authorization', 'Bearer ' + token)
      .send(payload)
      .expect(400)
      .end(function(err, res) {
        if (err) {
          done(err);
        }
        res.body.should.have.property('status', 400);
        res.body.should.have.property('error', 'bad_param');
        res.body.should.have.property('error_description',
          'parameter `ownerId` is required.|');
        done();
      });
    }); // - fails when missing ownerId

    it('returns 201 with all required fields', function(done) {
      api.post(endpoint)
      .type('form')
      .set('Authorization', 'Bearer ' + token)
      .send(payload)
      .expect(201)
      .end(function(err, res) {
        if (err) {
          done(err);
        }
        playlistId = res.body._id;
        res.body.should.have.property('title', payload.title);
        res.body.should.not.have.property('titleLower');
        res.body.should.not.have.property('deleted');
        res.body.should.have.property('ownerId');
        res.body.should.have.property('_id');
        res.body.should.have.property('updatedAt');
        done();
      });
    }); // - works when all is OK
  }); // - POSTing new playlist

  describe('PUTing Existing Playlist', function() {
    beforeEach(function(done) {
      payload = {
        title: 'Xmen 2099'
      };
      done();
    });
    it('fails without a valid accesstoken', function(done) {
      api.put(endpoint)
      .type('form')
      .set('Authorization', 'Bearer ' + '5703d23005g65c2f479e2Y3m')
      .send(payload)
      .expect(401)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        done();
      });
    }); // no update without valid token

    it('fails without a valid playlist id', function(done) {
      api.put(endpoint + '5703d23005g65c2f479e2Y3m')
      .type('form')
      .set('Authorization', 'Bearer ' + token)
      .send(payload)
      .expect(404)
      .end(function(err, res) {
        if (err) {
          done(err);
        }
        done();
      });
    }); // no update without valid id

    it('changes the playlist title to \'Xmen 2099\'', function(done) {
      api.put(endpoint + playlistId)
      .type('form')
      .set('Authorization', 'Bearer ' + token)
      .send(payload)
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.should.have.property('title', payload.title);
        res.body.should.not.have.property('titleLower');
        Playlist.findById(playlistId, function(err, pl) {
          pl.should.have.property('title', payload.title);
        });
        done();
      });
    }); // 'changes playlist title'

  }); // - PUTing existing playlist

  describe('GETing Existing Playlist...', function() {
    describe('All The Playlists', function() {
      before(function(done) {
        Playlist.create({
          title:   'Matrix Reloaded',
          ownerId: userId
        }, function(err, sp) {
          if (err) {
            console.log(err);
          }
          if (sp) {
            playlist2Id = sp._id;
          }
          done();
        });
      }); // End before

      it('returns an array with all two playlists', function(done) {
        api.get(endpoint)
        .type('form')
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          res.body.should.be.an.Array;
          res.body.should.have.length(2);
          done();
        });
      }); // returns array of 2

      it('return an array with non-deleted playlist', function(done) {
        Playlist.update({
          _id: playlist2Id
        }, {
          deleted: true
        }, function(err, res) {
          api.get(endpoint)
          .type('form')
          .set('Authorization', 'Bearer ' + token)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            res.body.should.be.an.Array;
            res.body.should.have.length(1);
            done();
          });
        });
      });// returns array of 1
    }); // all the playlist

    describe('Specific Playlist', function() {
      it('fails to find deleted playlist', function(done) {
        api.get(endpoint + playlist2Id)
        .type('form')
        .set('Authorization', 'Bearer ' + token)
        .expect(404)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          res.body.should.have.property('status', 404);
          res.body.should.have.property('error', 'not_found');
          res.body.should.have.property('error_description',
            'Playlist not found');
          done();
        });
      }); // 'fails to find deleted playlist'

      it('finds non-deleted playlist', function(done) {
        api.get(endpoint + playlistId)
        .type('form')
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          res.body.should.have.property('_id');
          res.body.should.have.property('title', payload.title);
          res.body.should.have.property('ownerId');
          res.body.should.have.property('updatedAt');
          done();
        });
      }); // 'finds non-deleted playlist'
    }); // specific playlist
  }); // - GETing existing playlist

  describe('DELETing Existing Playlist', function() {
    before(function(done) {
      User.create(dummyUser2, function(err, usr) {
        if (err) {
          return done(err);
        }
        payload = {
          grant_type:    'password',
          client_id:     fakeApp.clientId,
          client_secret: fakeApp.clientSecret,
          username:      dummyUser2.handle,
          password:      dummyUser2.password
        };
        api.post(saveTkn)
        .type('form')
        .send(payload)
        .expect(200)
        .end(function(err, res) {
          var savedToken = res.body;
          token2 = savedToken.access_token;
          done();
        });
      });
    });

    it('fails to delete deleted playlist', function(done) {
      api.delete(endpoint + playlist2Id)
      .type('form')
      .set('Authorization', 'Bearer ' + token)
      .expect(404)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.should.have.property('status', 404);
        res.body.should.have.property('error', 'not_found');
        res.body.should.have.property('error_description',
          'Playlist not found');
        done();
      });
    }); // 'fails to delete playlist'

    it('fails when not the owner of playlist', function(done) {
      api.delete(endpoint + playlistId)
      .type('form')
      .set('Authorization', 'Bearer ' + token2)
      .expect(403)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.should.have.property('status', 403);
        res.body.should.have.property('error', 'forbidden');
        res.body.should.have.property('error_description');
        done();
      });
    }); // END fails when not owner of playlist

    it('deletes non-deleted playlist', function(done) {
      api.delete(endpoint + playlistId)
      .type('form')
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        Playlist.findById(playlistId, function(err, playlist) {
          if (err) {
            return done(err);
          }
          playlist.deleted.should.be.true;
        });
        done();
      });
    }); // END deletes non-deleted playlist
  }); // - DELETing existing playlist
});
