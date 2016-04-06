var should   = require('chai').should();
var mongoose = require('mongoose');
var User     = require('../models/User.js');

var payload    = {};
var defaultUrl = 'zinfataClient/assets/images/user-avatar-placeholder.png';
var userId;
var query;
var mongo;

var whenMissing = function(field, done) {
  delete payload[field];
  var user = new User(payload);
  user.save(function(err, newUser) {
    err.should.not.be.null;
    should.not.exist(newUser);
    done();
  });
};

describe('Users', function() {
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

  describe('Mongoose model...', function() {
    beforeEach(function(done) {
      payload  = {
        firstName:  'Snoop',
        lastName:   'Dogg',
        handle:     'CalvinThABro',
        email:      'snoopy@dogpound.com',
        password:   'qwertyui'
      };
      done();
    });

    describe('Adding a new document...', function() {
      it('fails when \'firstName\' field is missing', function(done) {
        delete payload.firstName;
        var user = new User(payload);
        user.save(function(err, newUser) {
          err.should.not.be.null;
          should.not.exist(newUser);
          done();
        });
      });

      it('fails when \'lastName\' field is missing', function(done) {
        delete payload.lastName;
        var user = new User(payload);
        user.save(function(err, newUser) {
          err.should.not.be.null;
          should.not.exist(newUser);
          done();
        });
      });

      it('fails when \'handle\' field is missing', function(done) {
        delete payload.handle;
        var user = new User(payload);
        user.save(function(err, newUser) {
          err.should.not.be.null;
          should.not.exist(newUser);
          done();
        });
      });

      it('fails when \'email\' field is missing', function(done) {
        delete payload.email;
        var user = new User(payload);
        user.save(function(err, newUser) {
          err.should.not.be.null;
          should.not.exist(newUser);
          done();
        });
      });

      it('fails when handle is too short (< 3 chars)', function(done) {
        payload.handle = 'bs';
        var user = new User(payload);
        user.save(function(err, newUser) {
          err.should.not.be.null;
          should.not.exist(newUser);
          done();
        });
      });

      it('fails with an invalid email', function(done) {
        payload.email = 'thi5!snot.anEm@il';
        var user = new User(payload);
        user.save(function(err, newUser) {
          err.should.not.be.null;
          should.not.exist(newUser);
          done();
        });
      });

      it('works perfectly with all valid required field', function(done) {
        var user = new User(payload);
        user.save(function(err, newUser) {
          should.not.exist(err);
          newUser.should.not.be.null;
          newUser.should.have.property('firstName', payload.firstName);
          newUser.should.have.property('firstNameLower')
          .which.is.equal(newUser.firstName.toLowerCase());
          newUser.should.have.property('lastName', payload.lastName);
          newUser.should.have.property('lastNameLower')
          .which.is.equal(newUser.lastName.toLowerCase());
          newUser.should.have.property('handle', payload.handle);
          newUser.should.have.property('handleLower')
          .which.is.equal(newUser.handle.toLowerCase());
          newUser.should.have.property('updatedAt');
          newUser.should.have.property('_id');
          newUser.should.have.property('email', payload.email);
          newUser.should.have.property('password');
          newUser.should.have.property('activated', false);
          newUser.should.have.property('deleted', false);
          newUser.should.have.property('role', 'fan');
          newUser.should.have.property('avatarUrl', defaultUrl);

          userId = newUser._id;
          done();
        });
      });
    });

    describe('Retrieving documents...', function() {
      describe('By ID...', function() {
        it('fails with an invalid id', function(done) {
          var bsId = 'Pur3_bu!l5hi7';
          User.findById(bsId, function(err, user) {
            should.not.exist(user);
            should.exist(err);
            done();
          });
        });

        it('works with a valid id', function(done) {
          User.findById(userId, function(err, user) {
            should.not.exist(err);
            user.should.not.be.null;
            user.should.have.property('firstName', payload.firstName);
            user.should.have.property('firstNameLower', undefined);
            user.should.have.property('lastName', payload.lastName);
            user.should.have.property('lastNameLower', undefined);
            user.should.have.property('handle', payload.handle);
            user.should.have.property('handleLower', undefined);
            user.should.have.property('updatedAt');
            user.should.have.property('_id');
            user.should.have.property('email', payload.email);
            user.should.have.property('password', undefined);
            user.should.have.property('activated', false);
            user.should.have.property('deleted', undefined);
            user.should.have.property('role', 'fan');
            user.should.have.property('avatarUrl', defaultUrl);
            done();
          });
        });
      });

      describe('By a specific field...', function() {
        it('fails with a non-existing field', function(done) {
          query = {phony: 'Pur3_bu!l5hi7'};
          User.findOne(query, function(err, user) {
            should.not.exist(user);
            should.not.exist(err);
            done();
          });
        });

        it('fails with a field with invalid value', function(done) {
          query = {handle: 'Pur3_bu!l5hi7'};
          User.findOne(query, function(err, user) {
            should.not.exist(user);
            should.not.exist(err);
            done();
          });
        });

        it('works with a valid field and value', function(done) {
          var query = {handle: payload.handle};
          User.findOne(query, function(err, user) {
            should.not.exist(err);
            user.should.not.be.null;
            user.should.have.property('firstName', payload.firstName);
            user.should.have.property('firstNameLower', undefined);
            user.should.have.property('lastName', payload.lastName);
            user.should.have.property('lastNameLower', undefined);
            user.should.have.property('handle', payload.handle);
            user.should.have.property('handleLower', undefined);
            user.should.have.property('updatedAt');
            user.should.have.property('_id');
            user.should.have.property('email', payload.email);
            user.should.have.property('password', undefined);
            user.should.have.property('activated', false);
            user.should.have.property('deleted', undefined);
            user.should.have.property('role', 'fan');
            user.should.have.property('avatarUrl', defaultUrl);
            done();
          });
        });
      });

      describe('Only activated user...', function() {
        beforeEach(function(done) {
          query = {handle: payload.handle};
          done();
        });

        it('works with non-deleted users', function(done) {
          User.findActive(query, true, function(err, user) {
            should.not.exist(err);
            user.should.not.be.null;
            user.should.have.property('firstName', payload.firstName);
            user.should.have.property('firstNameLower', undefined);
            user.should.have.property('lastName', payload.lastName);
            user.should.have.property('lastNameLower', undefined);
            user.should.have.property('handle', payload.handle);
            user.should.have.property('handleLower', undefined);
            user.should.have.property('updatedAt');
            user.should.have.property('_id');
            user.should.have.property('email', payload.email);
            user.should.have.property('password', undefined);
            user.should.have.property('activated', false);
            user.should.have.property('deleted', undefined);
            user.should.have.property('role', 'fan');
            user.should.have.property('avatarUrl', defaultUrl);

            done();
          });
        });

        it('fails to find deleted users', function(done) {
          User.update({
            handle: payload.handle
          }, {
            deleted: true
          }, function(err, res) {
            console.log(res);
            User.findActive(query, true, function(err, user) {
            should.not.exist(user);
            should.not.exist(err);
            done();
          });
          });
        });
      });
    });

    describe('Testing Schema helper methods...', function() {
      var dummyUser;
      before(function(done) {
        User.findById(userId, function(err, user) {
          if (err) {
            throw('Couldn\'t get the test user');
          }
          dummyUser = user;

          done();
        });
      });

      describe('getUser', function() {
        it('fails with bad handle', function(done) {
          User.getUser('bs_handle', payload.password, function(err, user) {
            should.not.exist(err);
            user.should.be.false;
            done();
          });
        });

        it('fails with bad password', function(done) {
          User.getUser(payload.handle, 'bs_password', function(err, user) {
            should.not.exist(err);
            user.should.be.false;
            done();
          });
        });

        it('works when handle / password match', function(done) {
          User.getUser(payload.handle, payload.password, function(err, foundUserId) {
            console.log(userId);
            should.not.exist(err);
            foundUserId.should.eql(dummyUser._id);
            done();
          });
        });
      });
    });
  });
});
