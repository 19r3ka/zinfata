// oauthLogin.unitest.js

var should          = require('chai').should(),
    request         = require('supertest'),
    Client          = require('../models/OAuthClient.js'),
    app             = require('../app.js');

var api             = request(app),
    payload         = {},
    clientEndpoint  = 'clients/',
    tokenEndpoint   = 'oauth2/token/',
    zAccessToken    = 'zinfataclient/',
    zRefreshToken   = zAccessToken + 'refresh';

var dummyUser       = {
    firstName:  'modeste',
    lastName:   'rebel',
    handle:     'test',
    password:   'password',
    email:      'mail@gmail.com',
    whatsapp:   '29010101'
};

var client          = {
    id:         'fantastic_user',
    secret:     'imyourlover',
    redirect:   'backtomysite.com/get_token'
};  

describe('Oauth2 registration', function() {
    var userId;

    after(function() {
        Client.findByIdAndRemove(userId, function(err, client) {
            if(err) return console.log(err);
            if(client) console.log('Client %s flushed from database.', client.clientId);
        });
    });
    describe('Register api clients', function() {
        beforeEach(function() {
            payload = {
                client_id:     client.id,
                client_secret: client.secret,
                redirect_uri:  client.redirect 
            };
        });
        it('returns 400 error code when a required field is missing.', function(done) {
            delete payload.redirect_uri;
            app.post(clientEndpoint)
            .type('form')
            .send(payload)
            .expect(400)
            .end(function(err, res) {
                if(err) return done(err);
                res.body.should.have.property('message', 'Bad Input Parameter');
                res.body.should.have.property('details', 'Path `redirectUri` is required.|');
                done();
            });
        });
        it('returns 200 when new api client registration is successful.', function(done) {
            app.post(clientEndpoint)
            .type('form')
            .send(payload)
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);
                userId = res.body._id;
                res.body.should.have.property('clientId', client.id);
                res.body.should.have.property('clientSecret', client.secret);
                res.body.should.have.property('redirectUri', client.redirect);
                done();
            });
        });
    });

    describe('Working with access tokens.', function() {
        before(function() {
            payload = {
                client_id:     client.id,
                client_secret: client.secret,
                username:      dummyUser.handle,
                password:      dummyUser.password 
            };
        });
        describe('Get access token.', function() {
            beforeEach(function() {
                payload.grant_type = 'password';
            });
            it('returns 400 when required field is missing from request.', function(done) {
                delete payload.grant_type;
                app.post(tokenEndpoint)
                .type('form')
                .send(payload)
                .expect(400)
                .end(function(err, res) {
                    res.body.should.have.property('message', 'Invalid or missing grant_type parameter');
                    res.body.should.have.property('error_description', 'Invalid or missing grant_type parameter');
                    res.body.should.have.property('name', 'OAuth2Error');
                    res.body.should.have.property('error', 'invalid_request');
                    done();
                });
            });
            it('returns  400 when credentials are not found on server.', function(done) {
                payload.client_id = 'thisiswrong';
                app.post(tokenEndpoint)
                .type('form')
                .send(payload)
                .expect(400)
                .end(function(err, res) {
                    res.body.should.have.property('message', 'Client credentials are invalid');
                    res.body.should.have.property('error_description', 'Client credentials are invalid');
                    res.body.should.have.property('name', 'OAuth2Error');
                    res.body.should.have.property('error', 'invalid_client');
                    done();
                });
            });
            it('returns 200 with the access token when it works right.', function(done) {
                app.post(tokenEndpoint)
                .type('form')
                .send(payload)
                .expect(200)
                .end(function(err, res) {
                    res.body.should.have.property('token_type', 'bearer');
                    res.body.should.have.property('access_token');
                    res.body.should.have.property('refresh_token');
                    res.body.should.have.property('expires_in', 900);
                    done();
                });
            });
        });

        describe('Get access token for ZinfataClient.', function() {
            beforeEach(function() {
                delete payload.client_id;
                delete payload.client_secret;
            });
            it('returns 400 when required field is missing from request.', function(done) {
                delete payload.password;
                api.post(zAccessToken)
                .type('form')
                .send(payload)
                .expect(400)
                .end(function(err, res) {
                    res.body.should.have.property('token_type', 'bearer');
                    done();
                });
            });
            /*it('returns  when credentials are not found on server.', function() {
                payload.password = 'dummyPassword';
            });
            it('returns 200 with the access token when it works right.', function() {

            });*/
        });

        describe('Get new access token with refresh token.', function() {
            beforeEach(function() {
                payload.grant_type = 'refresh_token';
            });
            it('returns 400 when required field is missing from request.', function(done) {
                delete payload.client_id;
                app.post(tokenEndpoint)
                .type('form')
                .send(payload)
                .expect(400)
                .end(function(err, res) {
                    res.body.should.have.property('message', 'Invalid or missing client_id parameter');
                    res.body.should.have.property('error_description', 'Invalid or missing client_id parameter');
                    res.body.should.have.property('name', 'OAuth2Error');
                    res.body.should.have.property('error', 'invalid_client');
                    done();
                });
            });
            
            
            it('returns 200 with the access token when it works right.', function(done) {
                app.post(tokenEndpoint)
                .type('form')
                .send(payload)
                .expect(200)
                .end(function(err, res) {
                    res.body.should.have.property('token_type', 'bearer');
                    res.body.should.have.property('access_token');
                    res.body.should.have.property('refresh_token');
                    res.body.should.have.property('expires_in', 900);
                    done();
                });
            });
        });

        /*describe('Get refresh token for ZinfataClient.', function() {
            beforeEach(function() {
                payload.grant_type = 'refresh_token';
            });
            it('returns 400 when required field is missing from request.', function() {

            })
            it('returns  when credentials are not found on server.', function() {

            })
            it('returns 200 with the access token when it works right.', function() {

            })
        })

        describe('Make calls to protected api endpoints', function() {
            it('fails when no token is added to the request headers.', function() {
                api.get('api/albums')
                .  
            });
            it('works well with the token present in headers.', function() {
                api.get('api/albums')    
            });
        });

        describe('Revoke access token', function() {
            
        })

        describe('Revoke access token from ZinfataClient', function() {
            
        })*/
    });
});