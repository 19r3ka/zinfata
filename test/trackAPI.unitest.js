var should   = require('chai').should();
var mongoose = require('mongoose');
var request  = require('supertest');
var Oauth2   = require('../models/OAuthAccessToken.js');
var Client   = require('../models/OAuthClient.js');
var app      = require('../app.js');
var api      = request(app);

var User     = require('../models/User.js');
var Album    = require('../models/Album.js');
var Track    = require('../models/Track.js');

var mongo;
var userId;
var clientId;
var albumId;
var token;
var token2;
var trackId;
var track2Id;

var testAudio = 'test/files/test.mp3';
var payload  = {};
var temoin   = {};
var dummyUser1 = {
  firstName:  'Matt',
  lastName:   'Murdock',
  handle:     'DareDevil',
  email:      'Fearless@devilskitchen.fr',
  password:   'qwertyui'
};
var dummyUser2 = {
  firstName:  'Tony',
  lastName:   'Stark',
  handle:     'IronMan',
  email:      'flashymillionaire@starksco.tg',
  password:   'qwertyui'
};
var dummyAlbum = {
  title:       'Wu Tang Forever',
  artistId:    userId,
  releaseDate: new Date()
};
var fakeApp = {
  clientId:     'thisismysupercoolclientid',
  clientSecret: 'thisIsSomethingAbsolutelyDarkAndSecret',
  redirectUri:  'http://www.myapp.com'
};

/*Test Specific Variables */
var saveTkn  = '/oauth2/token/';
var endpoint = '/api/tracks/';

describe('Working With Track Endpoints', function() {
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
    dummyAlbum.artistId = userId;
    Album.create(dummyAlbum, function(err, alb) {
      if (err) {
        done(err);
      }
      if (alb) {
        albumId = alb._id.toString();
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

  describe('POSTing New Track', function() {
    it('returns 400 when `title` is missing', function(done) {
      var date = new Date();
      api.post(endpoint)
      .set('Authorization', 'Bearer ' + token)
      .field('releaseDate', date.toString())
      .field('artistId', userId)
      .field('albumId', albumId)
      .field('duration', 9600)
      .field('genre', 'Rap')
      .attach('audioFile', testAudio)
      .expect(400)
      .end(function(err, res) {
        if (err) {
          console.log(err);
          return done(err);
        }
        res.body.should.have.property('status', 400);
        res.body.should.have.property('error', 'bad_param');
        res.body.should.have.property('error_description',
          'parameter `title` is required.|');
        done();
      });
    }); // title is missing

    it('returns 400 when `artistId` is missing', function(done) {
      var date = new Date();
      api.post(endpoint)
      .set('Authorization', 'Bearer ' + token)
      .field('releaseDate', date.toString())
      .field('artistId', userId)
      .field('albumId', albumId)
      .field('duration', 9600)
      .field('genre', 'Rap')
      .attach('audioFile', testAudio)
      .expect(400)
      .end(function(err, res) {
        if (err) {
          console.log(err);
          return done(err);
        }
        res.body.should.have.property('status', 400);
        res.body.should.have.property('error', 'bad_param');
        res.body.should.have.property('error_description',
          'parameter `title` is required.|');
        done();
      });
    }); // artistId is missing

    it('returns 400 when `albumId` is missing', function(done) {
      delete payload.artistId;
      var date = new Date();
      api.post(endpoint)
      .set('Authorization', 'Bearer ' + token)
      .field('releaseDate', date.toString())
      .field('title', 'Wu Tang')
      .field('artistId', userId)
      .field('duration', 9600)
      .field('genre', 'Rap')
      .attach('audioFile', testAudio)
      .expect(400)
      .end(function(err, res) {
        if (err) {
          console.log(err);
          return done(err);
        }
        res.body.should.have.property('status', 400);
        res.body.should.have.property('error', 'bad_param');
        res.body.should.have.property('error_description',
          'parameter `albumId` is required.|');
        done();
      });
    }); // albumId is missing

    it('returns 400 when `genre` is missing', function(done) {
      api.post(endpoint)
      .set('Authorization', 'Bearer ' + token)
      .field('title', 'Wu Tang')
      .field('artistId', userId)
      .field('albumId', albumId)
      .field('duration', 9600)
      .field('releaseDate', (new Date()).toString())
      .attach('audioFile', testAudio)
      .expect(400)
      .end(function(err, res) {
        if (err) {
          console.log(err);
          return done(err);
        }
        res.body.should.have.property('status', 400);
        res.body.should.have.property('error', 'bad_param');
        res.body.should.have.property('error_description',
          'parameter `genre` is required.|');
        done();
      });
    });

    it.skip('returns 400 when `releaseDate` is missing', function(done) {
      api.post(endpoint)
      .set('Authorization', 'Bearer ' + token)
      .field('title', 'Wu Tang')
      .field('artistId', userId)
      .field('albumId', albumId)
      .field('duration', 9600)
      .field('genre', 'Rap')
      .attach('audioFile', testAudio)
      .expect(400)
      .end(function(err, res) {
        if (err) {
          console.log(err);
          return done(err);
        }
        res.body.should.have.property('status', 400);
        res.body.should.have.property('error', 'bad_param');
        res.body.should.have.property('error_description',
          'parameter `title` is required.|');
        done();
      });
    }); // releaseDate is missing

    it('returns 201 when all fields are present', function(done) {
      api.post(endpoint)
      .set('Authorization', 'Bearer ' + token)
      .field('title', 'Wu Tang')
      .field('artistId', userId)
      .field('albumId', albumId)
      .field('duration', 9600)
      .field('genre', 'Rap')
      .field('releaseDate', (new Date()).toString())
      .attach('audioFile', testAudio)
      .expect(201)
      .end(function(err, res) {
        if (err) {
          console.log(err);
          return done(err);
        }
        var trk = res.body;
        trk.should.have.property('genre', 'rap');
        trk.feat.should.be.an.Array;
        trk.sharing.should.be.false;
        // trk.downloadable.should.be.false;
        trk.should.not.have.property('deleted');
        trk.should.not.have.property('titleLower');
        trk._id.toString().should.have.length(24);
        trk.albumId.toString().should.have.length(24);
        trk.artistId.toString().should.have.length(24);
        trk.duration.should.be.a.Number;
        trk.size.should.be.a.Number;
        trk.updatedAt.should.be.a.Date;
        trk.releaseDate.should.be.a.Date;
        trk.title.should.equal('Wu Tang');

        trackId = trk._id;
        done();
      });
    });

  }); // posting new track

  describe('PUTing New Track', function() {
    before(function(done) {
      Track.findById(trackId, function(err, track) {
        if (err) {
          return done(err);
        }
        temoin.title       = track.title;
        temoin.streamUrl   = track.streamUrl;
        temoin.releaseDate = track.releaseDate;

        done();
      });
    });

    it('fails with invalid id', function(done) {
      api.put(endpoint + '5703d23005g65c2f479e2Y3m')
      .set('Authorization', 'Bearer ' + token)
      .field('title', 'Enter The 36 Chamber')
      .expect(404)
      .end(function(err, res) {
        if (err) {
          console.log(err);
          return done(err);
        }
        done();
      });
    }); // fails with a bogus trackid

    it('fails with invalid token', function(done) {
      api.put(endpoint + trackId)
      .set('Authorization', 'Bearer ' + '5703d23005g65c2f479e2Y3m')
      .field('genre', 'Rap')
      .expect(401)
      .end(function(err, res) {
        if (err) {
          console.log(err);
          return done(err);
        }
        done();
      });
    }); // fails with invalid token

    it('fails with invalid artistId', function(done) {
      api.put(endpoint + trackId)
      .set('Authorization', 'Bearer ' + token)
      .field('artistId', '5703d23005g65c2f479e2Y3m')
      .expect(400)
      .end(function(err, res) {
        if (err) {
          console.log(err);
          return done(err);
        }
        res.body.should.have.property('status', 400);
        res.body.should.have.property('error', 'bad_param');
        res.body.should.have.property('error_description',
          'The value of `artistId` is not valid.|');
        done();
      });
    }); // fails with invalid artistId

    it('fails with invalid albumId', function(done) {
      api.put(endpoint + trackId)
      .set('Authorization', 'Bearer ' + token)
      .field('albumId', '5703d23005g65c2f479e2Y3m')
      .expect(400)
      .end(function(err, res) {
        if (err) {
          console.log(err);
          return done(err);
        }
        res.body.should.have.property('status', 400);
        res.body.should.have.property('error', 'bad_param');
        res.body.should.have.property('error_description',
          'The value of `albumId` is not valid.|');
        done();
      });
    }); // fails with invalid artistId

    it('updates the title', function(done) {
      api.put(endpoint + trackId)
      .set('Authorization', 'Bearer ' + token)
      .field('title', 'Enter The 36th Chamber')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          console.log(err);
          return done(err);
        }
        Track.findById(trackId, function(err, track) {
          if (err) {
            return done(err);
          }
          track.title.should.not.equal(temoin.title);
          done();
        });
      });
    }); // updates title

    it('updates the genre', function(done) {
      api.put(endpoint + trackId)
      .set('Authorization', 'Bearer ' + token)
      .field('genre', 'Classic')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          console.log(err);
          return done(err);
        }
        Track.findById(trackId, function(err, track) {
          if (err) {
            return done(err);
          }
          track.should.have.property('genre', 'classic');
          done();
        });
      });
    }); // updates genre

    it('updates the releaseDate', function(done) {
      api.put(endpoint + trackId)
      .set('Authorization', 'Bearer ' + token)
      .field('releaseDate', (new Date().toString()))
      .expect(200)
      .end(function(err, res) {
        if (err) {
          console.log(err);
          return done(err);
        }
        Track.findById(trackId, function(err, track) {
          if (err) {
            return done(err);
          }
          track.releaseDate.should.not.equal(temoin.releaseDate);
          done();
        });
      });
    }); // updates releaseDate

    it('updates the audio file', function(done) {
      api.put(endpoint + trackId)
      .set('Authorization', 'Bearer ' + token)
      .attach('audioFile', 'test/files/test2.mp3')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          console.log(err);
          return done(err);
        }
        Track.findById(trackId, function(err, track) {
          if (err) {
            return done(err);
          }
          track.streamUrl.should.not.equal(temoin.streamUrl);
          done();
        });
      });
    }); // updates audio file
  }); // puting new track

  describe('GETing Existing Track...', function() {
    before(function(done) {
      payload = {
        title:       'Noir Desir',
        artistId:    userId,
        albumId:     albumId,
        size:        9800,
        duration:    96000,
        streamUrl:   'zinfata/path/to/my/track',
        genre:       'Rap',
        releaseDate: new Date()
      };

      Track.create(payload, function(err, tr) {
        if (err) {
          return done(err);
        }
        track2Id = tr._id;
        done();
      });
    });

    describe('All The Tracks', function() {
      it('returns array of two tracks', function(done) {
        api.get(endpoint)
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            console.log(err);
            return done(err);
          }
          res.body.should.be.a.Array;
          res.body.should.have.length(2);
          done();
        });
      }); // returns array of 2

      it('returns array of one non-deleted track', function(done) {
        Track.update({
          _id: track2Id
        }, {
          deleted: true
        }, function(err, track) {
          if (err) {
            return done(err);
          }

          api.get(endpoint)
          .set('Authorization', 'Bearer ' + token)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              console.log(err);
              return done(err);
            }
            res.body.should.be.a.Array;
            res.body.should.have.length(1);
            done();
          });
        });
      }); // returns array of 1
    }); // all the tracks

    describe('Specific Track', function() {
      it('fails to find deleted track', function(done) {
        api.get(endpoint + track2Id)
        .set('Authorization', 'Bearer ' + token)
        .expect(404)
        .end(function(err, res) {
          if (err) {
            console.log(err);
            return done(err);
          }
          done();
        });
      }); // fails to find deleted track

      it('finds non-deleted track', function(done) {
        api.get(endpoint + trackId)
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            console.log(err);
            return done(err);
          }
          done();
        });
      }); // finds non-deleted track
    }); // specific track
  }); // geting track

  describe('DELETing Existing Track', function() {
    it('fails to delete deleted track', function(done) {
      api.delete(endpoint + track2Id)
      .set('Authorization', 'Bearer ' + token)
      .expect(404)
      .end(done);
    }); // can't delete deleted track

    it('deletes non-deleted track', function(done) {
      api.delete(endpoint + trackId)
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }

        Track.findById(trackId, function(err, track) {
          if (err) {
            return done(err);
          }
          track.deleted.should.be.true;
          done();
        });
      });
    }); // deletes non-deleted track
  }); // deleting track
});
