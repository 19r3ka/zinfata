var should   = require('chai').should(),
    request  = require('supertest'),
    User     = require('../models/User.js'),
    app      = require('../app.js');

var api      = request(app),
    payload  = {};

describe('Users CRUD operations', function() {
    var userId;

    after(function() {
        User.findByIdAndRemove( userId, function(err, user) {
            if(err) return console.log(err);
            if(user) console.log('user %s flushed from database.', user.firstName);
        });
    })

    describe('/POSTing', function() {

        beforeEach(function() {
            payload  = {
                firstName:    'Snoop',
                lastName:     'Dogg',
                handle:       'DoggFather',
                email:        'snoop@dogpound.com',
                password:     'qwertyui'
            };
        })

        it('returns 400 when required keys missing', function(done) {
            /* delete one of the required properties */
            delete payload.handle;
            api.post('/api/users')
            .type('form')
            .send(payload)
            .expect(400, done);
        })

        it('returns 201 when user creation was successful', function(done) {
            api.post('/api/users')
            .type('form')
            .send(payload)
            .expect(201)
            .end(function(err, res) {
                if(err) return done(err);
                userId = res.body._id;
                (res.body).should.have.property('firstName', 'snoop');
                (res.body).should.have.property('lastName', 'dogg');
                (res.body).should.have.property('handle', 'doggfather');
                (res.body).should.have.property('email', 'snoop@dogpound.com');
                (res.body).should.have.property('password').which.is.null;
                done();
            });
        })

        it('returns 400 when the user already exists', function(done) {
            api.post('/api/users')
            .type('form')
            .send(payload)
            .expect(400, done);
        })
    });

    describe('/PuTing', function() {
        it('changes the user\'s firstName from Snoop to Nate', function(done) {
            api.put('/api/users/' + userId)
            .send({firstName: 'Nate'})
            .expect(200)
            .end(function(err, res) {
                if(err) done(err);
                (res.body.firstName).should.equal('nate');
                res.body.should.not.have.property('password');
                done();
            })

        })
    });

    describe('/GETing', function() {
        it('retrieves the user from the database', function(done) {
            api.get('/api/users/' + userId)
            .expect(200)
            .end(function(err, res) {
                if(err) done(err);
                res.body.firstName.should.exist.and.equal('nate');
                res.body.lastName.should.exist;
                res.body.handle.should.exist;
                res.body.email.should.exist;
                res.body.should.not.have.property('password');
                done();
            })
        })
    });

    describe('/DELETEing', function() {
        it('removes the selected user from the database', function(done) {
            api.delete('/api/users/' + userId)
            .send({})
            .expect(200)
            .end(function(err, res) {
                if(err) done(err);
                res.body.firstName.should.exist.and.equal('nate');
                res.body.lastName.should.exist;
                res.body.handle.should.exist;
                res.body.email.should.exist;
                res.body.should.not.have.property('password');
                done();
            })
        })
    });
});
