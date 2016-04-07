var should   = require('chai').should();
var mongoose = require('mongoose');
var User     = require('../models/User.js');
var Album    = require('../models/Album.js');
var Track    = require('../models/Track.js');

var userId;
var albumId;
var trackId;
var payload  = {};
var dummyUser1 = {
  firstName:  'Matt',
  lastName:   'Murdock',
  handle:     'DareDevil',
  email:      'Fearless@devilskitchen.fr',
  password:   'qwertyui'
};
var dummyAlbum = {
  title:       'Wu Tang Forever',
  artistId:    userId,
  releaseDate: new Date()
};

describe('Working With Tracks', function() {
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
        console.log(err);
        return done(err);
      }
      if (usr) {
        userId = usr._id.toString();
        done();
      }
    });
  }); // End before

  before(function(done) {
    dummyAlbum.artistId = userId;
    Album.create(dummyAlbum, function(err, alb) {
      if (err) {
        console.log(err);
        return done(err);
      }
      if (alb) {
        albumId = alb._id.toString();
      }
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

  describe('Creating New Track', function() {
    beforeEach(function(done) {
      payload = {
        title:       'Wu Tang',
        artistId:    userId,
        albumId:     albumId,
        size:        9800,
        duration:    96000,
        streamUrl:   'zinfata/path/to/my/track',
        genre:       'Rap',
        releaseDate: new Date()
      };
      done();
    }); // beforeEach

    it('fails when title is missing', function(done) {
      delete payload.title;
      Track.create(payload, function(err, trk) {
        should.exist(err);
        err.errors.should.have.property('title');
        err.errors.title.should.have.property('message',
          'Path `title` is required.');
        should.not.exist(trk);
        done();
      });
    }); // fails when title is missing

    it('fails when genre is missing', function(done) {
      delete payload.genre;
      Track.create(payload, function(err, trk) {
        should.exist(err);
        err.errors.should.have.property('genre');
        err.errors.genre.should.have.property('message',
          'Path `genre` is required.');
        should.not.exist(trk);
        done();
      });
    }); // fails when genre is missing

    it('fails when streamUrl is missing', function(done) {
      delete payload.streamUrl;
      Track.create(payload, function(err, trk) {
        should.exist(err);
        err.errors.should.have.property('streamUrl');
        err.errors.streamUrl.should.have.property('message',
          'Path `streamUrl` is required.');
        should.not.exist(trk);
        done();
      });
    }); // fails when streamUrl is missing

    it('fails when artistId is missing', function(done) {
      delete payload.artistId;
      Track.create(payload, function(err, trk) {
        should.exist(err);
        err.errors.should.have.property('artistId');
        err.errors.artistId.should.have.property('message',
          'Path `artistId` is required.');
        should.not.exist(trk);
        done();
      });
    }); // fails when artistId is missing

    it('fails when artistId is bogus', function(done) {
      payload.artistId = '5703d23005g65c2f479e2Y3m';
      Track.create(payload, function(err, trk) {
        should.exist(err);
        err.errors.should.have.property('artistId');
        err.errors.artistId.should.have.property('message',
          'The value of `artistId` is not valid.');
        should.not.exist(trk);
        done();
      });
    }); // fails when artistId is wrong

    it('fails when albumId is missing', function(done) {
      delete payload.albumId;
      Track.create(payload, function(err, trk) {
        should.exist(err);
        err.errors.should.have.property('albumId');
        err.errors.albumId.should.have.property('message',
          'Path `albumId` is required.');
        should.not.exist(trk);
        done();
      });
    }); // fails when albumId is missing

    it('fails when albumId is bogus', function(done) {
      payload.albumId = '5703d23005g65c2f479e2Y3m';
      Track.create(payload, function(err, trk) {
        should.exist(err);
        err.errors.should.have.property('albumId');
        err.errors.albumId.should.have.property('message',
          'The value of `albumId` is not valid.');
        should.not.exist(trk);
        done();
      });
    }); // fails when albumId is bogus

    it('fails when size is missing', function(done) {
      delete payload.size;
      Track.create(payload, function(err, trk) {
        should.exist(err);
        err.errors.should.have.property('size');
        err.errors.size.should.have.property('message',
          'Path `size` is required.');
        should.not.exist(trk);
        done();
      });
    }); // fails when size is missing

    it('fails when size is not a number', function(done) {
      payload.size = 'notanumber';
      Track.create(payload, function(err, trk) {
        should.exist(err);
        err.errors.should.have.property('size');
        err.errors.size.should.have.property('message',
          'Cast to Number failed for value "notanumber" at path "size"');
        should.not.exist(trk);
        done();
      });
    }); // fails when size is not a number

    it('fails when duration is missing', function(done) {
      delete payload.duration;
      Track.create(payload, function(err, trk) {
        should.exist(err);
        err.errors.should.have.property('duration');
        err.errors.duration.should.have.property('message',
          'Path `duration` is required.');
        should.not.exist(trk);
        done();
      });
    }); // fails when duration is missing

    it('fails when duration is not a number', function(done) {
      payload.duration = 'notanumber';
      Track.create(payload, function(err, trk) {
        should.exist(err);
        err.errors.should.have.property('duration');
        err.errors.duration.should.have.property('message',
          'Cast to Number failed for value "notanumber" at path "duration"');
        should.not.exist(trk);
        done();
      });
    }); // fails when duration is not a number

    it('fails when releaseDate is missing', function(done) {
      delete payload.releaseDate;
      Track.create(payload, function(err, trk) {
        should.exist(err);
        err.errors.should.have.property('releaseDate');
        err.errors.releaseDate.should.have.property('message',
          'Path `releaseDate` is required.');
        should.not.exist(trk);
        done();
      });
    }); // fails when releaseDate is missing

    it('fails when releaseDate is not a date', function(done) {
      payload.releaseDate = 'notadate';
      Track.create(payload, function(err, trk) {
        should.exist(err);
        err.errors.should.have.property('releaseDate');
        err.errors.releaseDate.should.have.property('message',
          'Cast to Date failed for value "notadate" at path "releaseDate"');
        should.not.exist(trk);
        done();
      });
    }); // fails when releaseDate is not a date

    it('works when all fields are present', function(done) {
      new Track(payload).save(function(err, trk) {
      // Track.create(payload, function(err, trk) {
        should.not.exist(err);
        should.exist(trk);
        trk.should.have.property('genre', payload.genre.toLowerCase());
        trk.feat.should.be.an.Array;
        trk.sharing.should.be.false;
        trk.downloadable.should.be.false;
        trk.deleted.should.be.false;
        trk._id.toString().should.have.length(24);
        trk.albumId.toString().should.have.length(24);
        trk.artistId.toString().should.have.length(24);
        trk.duration.should.be.a.Number;
        trk.duration.should.equal(payload.duration);
        trk.size.should.be.a.Number;
        trk.size.should.equal(payload.size);
        trk.updatedAt.should.be.a.Date;
        trk.releaseDate.should.be.a.Date;
        trk.title.should.equal(payload.title);
        trk.titleLower.should.equal(payload.title.toLowerCase());
        trackId = trk._id;
        done();
      });
    });
  }); // creating new track

  describe('Getting Existing Track', function() {
    describe('By Id', function() {
      it('fails with a bogus trackId', function(done) {
        Track.findById('5703d23005g65c2f479e2Y3m', function(err, trk) {
          should.not.exist(trk);
          should.not.exist(err);
          done();
        });
      }); // fails with bogus id

      it('works with a valid trackId', function(done) {
        Track.findById(trackId, function(err, trk) {
          should.not.exist(err);
          should.exist(trk);
          trk.should.have.property('titleLower', undefined);
          trk.should.have.property('deleted', undefined);
          var keys = ['_id', 'title', 'artistId', 'albumId', 'size',
                      'duration','streamUrl', 'genre', 'releaseDate',
                      'updatedAt', 'coverArt', 'downloadable',
                      'sharing', 'feat'];
          for (var i = 0; i < keys.length; i++) {
            should.exist(trk[keys[i]]);
          }
          done();
        });
      }); // works with valid id
    }); // by id

    describe('By Deletion Status', function() {
      it('works with non-deleted track', function(done) {
        Track.findActive({_id: trackId}, true, function(err, trk) {
          should.not.exist(err);
          should.exist(trk);
          var keys = ['_id', 'title', 'artistId', 'albumId', 'size',
                      'duration','streamUrl', 'genre', 'releaseDate',
                      'updatedAt', 'coverArt', 'downloadable',
                      'sharing', 'feat'];
          for (var i = 0; i < keys.length; i++) {
            should.exist(trk[keys[i]]);
          }
          done();
        });
      }); // works with non-deleted track

      it('fails with deleted track', function(done) {
        Track.update({
          title: payload.title
        }, {
          deleted: true
        }, function(err, res) {
          Track.findActive({_id: trackId}, true, function(err, trk) {
            should.not.exist(err);
            should.not.exist(trk);
            done();
          });
        });
      }); // fails with deleted track
    });
  }); // getting existing track
});
