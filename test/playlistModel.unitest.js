var should     = require('chai').should();
var mongoose   = require('mongoose');
var User       = require('../models/User.js');
var Playlist   = require('../models/Playlist.js');

var userId;
var playlistId;
var query   = {};
var payload = {};

var dummyUser = {
  firstName:  'Peter',
  lastName:   'Parker',
  handle:     'Spiderman',
  email:      'webslinger@nyc.com',
  password:   'qwertyui'
};

describe('Working With Playlists', function() {
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
    User.create(dummyUser, function(err, usr) {
      if (err) {
        done(err);
      }
      if (usr) {
        userId = usr._id;
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

  describe('Creating New Playlist', function(done) {
    beforeEach(function(done) {
      payload = {
        title:   'New Republic',
        ownerId: userId
      };
      done();
    });

    it('fails when the title is missing', function(done) {
      delete payload.title;
      Playlist.create(payload, function(err, pl) {
        should.exist(err);
        err.errors.should.have.property('title');
        err.errors.title.should.have.property('message',
          'Path `title` is required.');
        should.not.exist(pl);
        done();
      });
    }); // -fails when the title is missing

    it('fails when the ownerId is missing', function(done) {
      delete payload.ownerId;
      Playlist.create(payload, function(err, pl) {
        should.exist(err);
        err.errors.should.have.property('ownerId');
        err.errors.ownerId.should.have.property('message',
          'Path `ownerId` is required.');
        should.not.exist(pl);
        done();
      });
    }); // -fails when the ownerId is missing

    it('fails with a bogus ownerId', function(done) {
      payload.ownerId = '5703d23005G65c2f479e22De';
      Playlist.create(payload, function(err, pl) {
        should.exist(err);
        err.errors.should.have.property('ownerId');
        err.errors.ownerId.should.have.property('message',
          'The value of `ownerId` is not valid.');
        should.not.exist(pl);
        done();
      });
    }); // -fails with a bogus ownerId

    it('works with all required fields', function(done) {
      Playlist.create(payload, function(err, pl) {
        should.not.exist(err);
        should.exist(pl);
        pl.should.have.property('title', payload.title);
        pl.titleLower.should.equal(payload.title.toLowerCase());
        pl.ownerId.should.equal(userId);
        pl.tracks.should.be.an.Array;
        pl.tracks.should.be.empty;
        pl.deleted.should.be.false;

        playlistId = pl._id;
        done();
      });
    }); // -fails with a bogus ownerId
  });

  describe('Getting Existing Playlist', function(done) {
    describe('By ID', function() {
      it('fails with some bogus id', function(done) {
        Playlist.findById('5703d23005G65c2f479e22De', function(err, pl) {
          should.not.exist(err);
          should.not.exist(pl);
          done();
        });
      }); // - fails with some bogus id

      it('works with the proper id', function(done) {
        Playlist.findById(playlistId, function(err, pl) {
          should.not.exist(err);
          should.exist(pl);
          pl.should.have.property('title', payload.title);
          pl.should.have.property('titleLower', undefined);
          pl.should.have.property('ownerId');
          pl.tracks.should.be.an.Array;
          pl.tracks.should.be.empty;
          pl.deleted.should.be.false;
          done();
        });
      }); // - fails with some bogus id
    }); // - by id

    describe('By Deletion Status', function() {
      beforeEach(function(done) {
        query = {
          _id: playlistId
        };
        done();
      });

      it('finds a non-deleted playlist', function(done) {
        Playlist.findActive(query, true, function(err, pl) {
          should.not.exist(err);
          should.exist(pl);
          pl.should.have.property('title', payload.title);
          pl.should.have.property('titleLower', undefined);
          pl.should.have.property('ownerId');
          pl.tracks.should.be.an.Array;
          pl.tracks.should.be.empty;
          pl.deleted.should.be.false;
          done();
        });
      }); // - finds a non-deleted playlist

      it('fails to find a deleted playlist', function(done) {
        Playlist.update(
          query, {
            deleted: true
          }, function(err, res) {
            console.log(res);
            Playlist.findActive(query, true, function(err, pl) {
            should.not.exist(pl);
            should.not.exist(err);
            done();
          });
        });
      }); // - finds a non-deleted playlist
    }); // - by deletion status
  }); // - Getting existing playlist
});
