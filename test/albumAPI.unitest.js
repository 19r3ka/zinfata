var should   = require('chai').should();
var request  = require('supertest');
var mongoose = require('mongoose');
var User     = require('../models/User.js');
var Album    = require('../models/Album.js');
var Oauth2   = require('../models/OAuthAccessToken.js');
var Client   = require('../models/OAuthClient.js');
var app      = require('../app.js');
var api      = request(app);

var mongo;
var clientId;
var userId;
var albumId;
var album2Id;
var endpoint = '/api/albums/';
var saveTkn  = '/oauth2/token/';
var token    = '5703d23005g65c2f479e2f3m';
var expires  = 9600;
var payload  = {};

var fakeApp = {
  clientId:     'thisismysupercoolclientid',
  clientSecret: 'thisIsSomethingAbsolutelyDarkAndSecret',
  redirectUri:  'http://www.myapp.com'
};
var dummyUser1 = {
  firstName: 'Barry',
  lastName:  'Allen',
  handle:    'TheFlash',
  email:     'scarletspeedster@ccpd.com',
  password:  'qwertyui'
};
var dummyUser2 = {
  firstName: 'Clark',
  lastName:  'Kent',
  handle:    'Superman',
  email:     'manofsteel@thedailybugle.com',
  password:  'qwertyui'
};
var dummyAlbum = {
  title:       'NGTD',
  releaseDate: new Date(),
  artistId:    ''
};

describe('Accessing Album Endpoints', function() {
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
        done();
      });
    });
  }); // End before

  before(function(done) {
    User.create(dummyUser1, function(err, usr) {
      if (err) {
        done(err);
      }
      if (usr) {
        userId = usr._id;
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

  describe('Accessing endpoint without valid bearer token', function() {
    it('returns 400 without access token is header', function(done) {
      api.post(endpoint)
      .type('form')
      .send(payload)
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
      api.post(endpoint)
      .type('form')
      .set('Authorization', 'bearer ' + token)
      .send(payload)
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
      api.post(endpoint)
      .type('form')
      .set('Authorization', 'Bearer 5703d23005g65c2f479e2Y3m')
      .send(payload)
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
      .send(payload)
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        done();
      });
    }); //END 'returns 400 when bearer token valid'
  }); // END 'testing access token in header'

  describe('POSTing an album', function() {
    beforeEach(function(done) {
      payload = {};
      for (var key in dummyAlbum) {
        payload[key] = dummyAlbum[key];
      }
      payload.artistId = userId.toString();
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
    }); // END 'when title is missing'

    it('returns 400 when releaseDate is missing', function(done) {
      delete payload.releaseDate;
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
          'parameter `releaseDate` is required.|');
        done();
      });
    }); // END 'when releaseDate is missing'

    it('returns 400 when artistId is missing', function(done) {
      delete payload.artistId;
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
          'parameter `artistId` is required.|');
        done();
      });
    }); // END 'when artistId is missing'

    it('returns 201 when required fields are present', function(done) {
      api.post(endpoint)
      .type('form')
      .set('Authorization', 'Bearer ' + token)
      .send(payload)
      .expect(201)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        albumId = res.body._id;
        res.body.should.have.property('title', dummyAlbum.title);
        res.body.should.have.property('releaseDate');
        res.body.should.have.property('artistId');
        res.body.should.not.have.property('titleLower');
        done();
      });
    }); // END 'when all is OK'
  }); // END 'posting an album'

  describe('PUTing an album', function() {
    it('changes the album title to \'Clone Wars\'', function(done) {
      payload.title = 'Clone Wars';
      api.put(endpoint + albumId)
      .type('form')
      .set('Authorization', 'Bearer ' + token)
      .send(payload)
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.should.have.property('title', payload.title);
        res.body.should.have.property('releaseDate');
        res.body.should.have.property('artistId');
        res.body.should.not.have.property('titleLower');
        Album.findById(albumId, function(err, album) {
          album.should.have.property('title', payload.title);
        });
        done();
      });
    }); // 'changes album title'

    it('fails without a valid access token', function(done) {
      payload.title = 'Clone Wars';
      api.put(endpoint + albumId)
      .type('form')
      .set('Authorization', 'Bearer 5703d23005g65c2f479e2Y3m')
      .send(payload)
      .expect(401)
      .end(function(err, res) {
        should.not.exist(err);
        res.body.should.have.property('code', 401);
        res.body.should.have.property('error', 'invalid_token');
        res.body.should.have.property('error_description',
          'The access token provided is invalid.');
        done();
      });
    }); // END 'update fails without valid access token'
  }); // END 'puting an album'

  describe('GETing...', function() {
    describe('All the albums', function() {
      before(function(done) {
        Album.create({
          title:       'Revenge of the Sith',
          releaseDate: new Date(),
          artistId:    userId
        }, function(err, secondAlbum) {
          if (err) {
            console.log(err);
          }
          if (secondAlbum) {
            album2Id = secondAlbum._id;
          }
          done();
        });
      }); // END before

      it('returns an array with all two albums', function(done) {
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
      });// END 'returns an array of length 2'

      it('returns an array with one non-deleted album', function(done) {
        Album.update({
            _id: album2Id
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
          }
        );
      });// END 'returns an array of length 1'
    }); // END 'All the albums'

    describe('Specific album', function(done) {
      it('fails to find deleted album', function(done) {
        api.get(endpoint + album2Id)
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
            'Album not found');
          done();
        });
      }); // 'fails to find deleted album'

      it('finds non-deleted album', function(done) {
        api.get(endpoint + albumId)
        .type('form')
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          res.body.should.have.property('_id');
          res.body.should.have.property('title', payload.title);
          res.body.should.have.property('artistId');
          res.body.should.have.property('releaseDate');
          res.body.should.have.property('imageUrl');
          res.body.should.have.property('updatedAt');
          done();
        });
      }); // 'finds non-deleted album'
    }); // 'Specific album'
  }); // END 'Geting albums'

  describe('DELETing album', function() {
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

    it('fails to delete deleted album', function(done) {
      api.delete(endpoint + album2Id)
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
          'Album not found');
        done();
      });
    }); // 'fails to delete album'

    it('fails when not the owner of album', function(done) {
      api.delete(endpoint + albumId)
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
    }); // END fails when not owner of album

    it('deletes non-deleted album', function(done) {
      api.delete(endpoint + albumId)
      .type('form')
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        Album.findById(albumId, function(err, album) {
          if (err) {
            return done(err);
          }
          album.deleted.should.be.true;
        });
        done();
      });
    }); // END deletes non-deleted album
  }); // END 'Deleting album'
});
