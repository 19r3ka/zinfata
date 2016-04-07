var should     = require('chai').should();
var mongoose   = require('mongoose');
var User       = require('../models/User.js');
var Album      = require('../models/Album.js');

var userId;
var albumId;
var query   = {};
var payload = {};

var dummyAlbum = {
  title:       'Empire Strikes Back',
  releaseDate: new Date(),
  artistId:    ''
};
var dummyUser = {
  firstName:  'Snoop',
  lastName:   'Dogg',
  handle:     'CalvinThABro',
  email:      'snoopy@dogpound.com',
  password:   'qwertyui'
};

describe('Working with albums', function() {
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

  describe('Creating new album', function() {
    beforeEach(function(done) {
      for (var key in dummyAlbum){
        payload[key] = dummyAlbum[key];
      }
      payload.artistId = userId;
      done();
    });

    it('fails when title is missing.', function(done) {
      delete payload.title;
      Album.create(payload, function(err, newAlbum) {
        should.exist(err);
        err.errors.should.have.property('title');
        err.errors.title.should.have.property('message',
          'Path `title` is required.');
        should.not.exist(newAlbum);
        done();
      });
    }); // End 'fails when title is missing'

    it('fails when releaseDate is missing.', function(done) {
      delete payload.releaseDate;
      Album.create(payload, function(err, newAlbum) {
        should.exist(err);
        should.not.exist(newAlbum);
        err.errors.should.have.property('releaseDate');
        err.errors.releaseDate.should.have.property('message',
          'Path `releaseDate` is required.');
        done();
      });
    }); // End 'fails when releaseDate is missing'

    it('fails when artistId is missing.', function(done) {
      delete payload.artistId;
      Album.create(payload, function(err, newAlbum) {
        should.exist(err);
        should.not.exist(newAlbum);
        err.errors.should.have.property('artistId');
        err.errors.artistId.should.have.property('message',
          'Path `artistId` is required.');
        done();
      });
    }); // End 'fails when artistId is missing'

    it('fails when artistId is wrong.', function(done) {
      payload.artistId = '5703d23005G65c2f479e22De';
      Album.create(payload, function(err, newAlbum) {
        should.exist(err);
        err.errors.should.have.property('artistId');
        err.errors.artistId.should.have.property('message',
          'The value of `artistId` is not valid.');
        should.not.exist(newAlbum);
        done();
      });
    }); // End 'fails when artistId is missing'

    it('works when all required fields are present.', function(done) {
      Album.create(payload, function(err, newAlbum) {
        should.not.exist(err);
        should.exist(newAlbum);
        newAlbum.should.have.property('_id');
        newAlbum.should.have.property('releaseDate');
        newAlbum.should.have.property('imageUrl');
        newAlbum.should.have.property('artistId', userId);
        newAlbum.should.have.property('title', dummyAlbum.title);
        newAlbum.titleLower.should.equal(dummyAlbum.title.toLowerCase());
        albumId = newAlbum._id;
        done();
      });
    }); // End 'works when all required fields are present'
  }); // End 'Creating new album'

  describe('Getting existing album', function() {
    describe('By ID', function() {
      it('fails with non-exisiting album id', function(done) {
        Album.findById('5703d23005G65c2f479e22De', function(err, album) {
          should.not.exist(err);
          should.not.exist(album);
          done();
        });
      }); // End 'fails with non-existing album id'

      it('works with a legit album id', function(done) {
        Album.findById(albumId, function(err, album) {
          should.not.exist(err);
          should.exist(album);
          album.should.have.property('_id');
          album.should.have.property('releaseDate');
          album.should.have.property('artistId');
          album.should.have.property('title', dummyAlbum.title);
          album.should.have.property('imageUrl');
          done();
        });
      }); // End 'works with a legit album id'
    }); // End 'By ID'

    describe('By Title', function() {
      it('fails when the title does not exist', function(done) {
        Album.findOne({title: 'this is not the one'}, function(err, album) {
          should.not.exist(err);
          should.not.exist(album);
          done();
        });
      }); // End 'fails when the title does not exist'

      it('works with an existing album title', function(done) {
        Album.findOne({title: dummyAlbum.title}, function(err, album) {
          should.not.exist(err);
          should.exist(album);
          album.should.have.property('_id');
          album.should.have.property('releaseDate');
          album.should.have.property('artistId');
          album.should.have.property('title', dummyAlbum.title);
          album.should.have.property('imageUrl');
          done();
        });
      }); // End 'fails when the title does not exist'
    }); // End 'By Title'

    describe('By deletion status', function() {
      before(function(done) {
        query = {title: dummyAlbum.title};
        done();
      });

      it('works with non-deleted albums', function(done) {
        Album.findActive(query, true, function(err, album) {
          should.not.exist(err);
          should.exist(album);
          album.should.have.property('_id');
          album.should.have.property('releaseDate');
          album.should.have.property('artistId');
          album.should.have.property('title', dummyAlbum.title);
          album.should.have.property('imageUrl');
          done();
        });
      });

      it('fails to find deleted users', function(done) {
        Album.update({
          title: dummyAlbum.title
        }, {
          deleted: true
        }, function(err, res) {
          Album.findActive(query, true, function(err, album) {
          should.not.exist(album);
          should.not.exist(err);
          done();
        });
        });
      });
    }); // End 'By Deletion Status'
  }); // End 'Getting existing album'
});
