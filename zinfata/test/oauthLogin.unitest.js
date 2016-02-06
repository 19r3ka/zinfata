// oauthLogin.unitest.js

var should          = require('chai').should(),
    request         = require('supertest'),
    Client          = require('../models/OAuthClient.js'),
    User            = require('../models/User.js'),
    app             = require('../app.js');

var api             = request(app),
    payload         = {},
    clientEndpoint  = '/clients',
    tokenEndpoint   = '/oauth2/token',
    revokeEndpoint  = '/oauth2/revoke',
    zATEndpoint     = '/zinfataclient',
    zRTEndpoint     = zATEndpoint + '/refresh';

var dummyUser       = {
    firstName:  'modeste',
    lastName:   'rebel',
    handle:     'test',
    password:   'password',
    email:      'mail@gmail.com',
    whatsapp:   '29010101'
};

var client          = {
    id:         'zinfata',
    secret:     '\'pass\'',
    redirect:   'backtomysite.com/get_token'
};  

describe('Oauth2 registration:', function() {
    var clientId,
        userId;

    beforeEach(function() {
        User.create(dummyUser, function(err, user) {
            if(err) return console.log(err);
            if(user) {
                console.log('new user %s created', user.firstName);
                userId = user._id;
            } else {
                console.log('couldn\'t create the dummy user'); 
            }
        });
    });

    after(function() {
        Client.findByIdAndRemove(clientId, function(err, client) {
            if(err) return console.log(err);
            if(client) console.log('Client %s flushed from database.', client.clientId);
        });
        User.findByIdAndRemove(userId, function(err, user) {
            if(err) console.log(err);
            if(user) console.log('User %s deleted!', user.firstName);
        });
    });

    describe('Register api clients:', function() {
        beforeEach(function() {
            payload = {
                client_id:     client.id,
                client_secret: client.secret,
                redirect_uri:  client.redirect 
            };
        });

        it('returns 400 for missing required parameter;', function(done) {
            delete payload.redirect_uri;
            api.post(clientEndpoint)
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

        it('returns 200 when new api client registration is successful;', function(done) {
            api.post(clientEndpoint)
            .type('form')
            .send(payload)
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);
                clientId = res.body._id;
                res.body.should.have.property('clientId', client.id);
                res.body.should.have.property('clientSecret', client.secret);
                res.body.should.have.property('redirectUri', client.redirect);
                done();
            });
        });
    });

    describe('Working with access tokens:', function() {
        var access_token,
            zAccessToken,
            refresh_token,
            zRefreshToken;

        function defaultValues() {
            return {
                client_id:     client.id,
                client_secret: client.secret,
                username:      dummyUser.handle,
                password:      dummyUser.password 
            };   
        };

        describe('Get access token:', function() {
            describe('for any registered clients:', function() {
                describe('for the first time:', function() {
                    beforeEach(function() {
                        payload = defaultValues();
                        payload.grant_type = 'password';
                    });
                    it('returns 400 for missing grant_type parameter;', function(done) {
                        delete payload.grant_type;
                        api.post(tokenEndpoint)
                        .type('form')
                        .send(payload)
                        .expect(400)
                        .end(function(err, res) {
                            if(err) return done(err);
                            res.body.should.have.property('code', 400);
                            res.body.should.have.property('error_description', 'Invalid or missing grant_type parameter');
                            res.body.should.have.property('error', 'invalid_request');
                            done();
                        });
                    });
                    it('returns  400 for missing client_secret parameter;', function(done) {
                        delete payload.client_secret;
                        api.post(tokenEndpoint)
                        .type('form')
                        .send(payload)
                        .expect(400)
                        .end(function(err, res) {
                            if(err) return done(err);
                            res.body.should.have.property('code', 400);
                            res.body.should.have.property('error_description', 'Missing client_secret parameter');
                            res.body.should.have.property('error', 'invalid_client');
                            done();
                        });
                    });
                    it('returns  400 when invalid client credentials;', function(done) {
                        payload.client_id = 'thisiswrong';
                        api.post(tokenEndpoint)
                        .type('form')
                        .send(payload)
                        .expect(400)
                        .end(function(err, res) {
                            if(err) return done(err);
                            res.body.should.have.property('code', 400);
                            res.body.should.have.property('error_description', 'Client credentials are invalid');
                            res.body.should.have.property('error', 'invalid_client');
                            done();
                        });
                    });
                    it('returns 200 with the access token when it works right;', function(done) {
                        api.post(tokenEndpoint)
                        .type('form')
                        .send(payload)
                        .expect(200)
                        .end(function(err, res) {
                            if(err) return done(err);
                            res.body.should.have.property('token_type', 'bearer');
                            res.body.should.have.property('access_token');
                            res.body.should.have.property('refresh_token');
                            res.body.should.have.property('expires_in', 900);
                            /*Save the tokens for refreshing and revoking.*/
                            if(!!res.body.access_token) access_token   = res.body.access_token;
                            if(!!res.body.refresh_token) refresh_token = res.body.refresh_token;
                            done();
                        });
                    });
                });
                describe('with refresh_token:', function() {
                    beforeEach(function() {
                        payload = defaultValues();
                        payload.grant_type    = 'refresh_token';
                        payload.refresh_token = refresh_token;
                        delete payload.username;
                        delete payload.password;
                    });
                    it('returns 400 for missing required field;', function(done) {
                        delete payload.client_id;
                        api.post(tokenEndpoint)
                        .type('form')
                        .send(payload)
                        .expect(400)
                        .end(function(err, res) {
                            if(err) return done(err);
                            res.body.should.have.property('error_description', 'Invalid or missing client_id parameter');
                            res.body.should.have.property('error', 'invalid_client');
                            done();
                        });
                    });
                    it('returns 400 invalid required field;', function(done) {
                        payload.client_id = 'wrong';
                        api.post(tokenEndpoint)
                        .type('form')
                        .send(payload)
                        .expect(400)
                        .end(function(err, res) {
                            if(err) return done(err);
                            res.body.should.have.property('error_description', 'Client credentials are invalid');
                            res.body.should.have.property('error', 'invalid_client');
                            done();
                        });
                    });
                    it('returns 200 with the access token when it works right;', function(done) {
                        api.post(tokenEndpoint)
                        .type('form')
                        .send(payload)
                        .expect(200)
                        .end(function(err, res) {
                            if(err) return done(err);
                            res.body.should.have.property('token_type', 'bearer');
                            res.body.should.have.property('access_token');
                            res.body.should.have.property('refresh_token');
                            res.body.should.have.property('expires_in', 900);
                            done();
                        });
                    });
                });
            });
            describe('For ZinfataClient:', function() {
                /*before(function() {
                    Client.findOne({clientId: 'zinfata'}, function(err, client) {
                        if(err) console.log(err);
                        if(!client) {
                            Client.create({ clientId: 'zinfata',
                                            clientSecret: '\'pass\'', 
                                            redirectUri: 'zinfata.com'},
                                            function(err, new_client) {
                                                if(err) console.log(err);
                                                if(!new_client) console.log('couldn\'t register zinfataclient');
                                            }
                            );
                        }
                    });
                });*/

                describe('for the first time:', function() {
                    beforeEach(function() {
                        payload = defaultValues();
                        delete payload.client_id;
                        delete payload.client_secret;
                    });
                    it('returns 400 for missing required parameters;', function(done) {
                        delete payload.password;
                        api.post(zATEndpoint)
                        .type('form')
                        .send(payload)
                        .expect(400)
                        .end(function(err, res) {
                            console.log(res);
                            if(err) return done(err);
                            res.body.should.have.property('error', 'invalid_request');
                            res.body.should.have.property('error_description', 'Missing parameters. \'username\' and \'password\' are required');
                            done();
                        });
                    });
                    it('returns 400 for invalid user credentials;', function(done) {
                        payload.password = 'dummyPassword';
                        api.post(zATEndpoint)
                        .type('form')
                        .send(payload)
                        .expect(400)
                        .end(function(err, res) {
                            if(err) return done(err);
                            res.body.should.have.property('code', 400);
                            res.body.should.have.property('error', 'invalid_grant');
                            res.body.should.have.property('error_description', 'User credentials are invalid');
                            done();
                        });
                    });
                    it('returns 200 with the access token when it works right;', function(done) {
                        api.post(zATEndpoint)
                        .type('form')
                        .send(payload)
                        .expect(200)
                        .end(function(err, res) {
                            if(err) return done(err);
                            res.body.should.have.property('token_type', 'bearer');
                            res.body.should.have.property('access_token');
                            res.body.should.have.property('refresh_token');
                            res.body.should.have.property('expires_in', 900);
                            if(res.body.access_token) zAccessToken   = res.body.access_token;
                            if(res.body.refresh_token) zRefreshToken = res.body.refresh_token;
                            done();
                        });
                    });
                });
                describe('with refresh_token:', function() {
                    beforeEach(function() {
                        payload = {
                            // grant_type:     'refresh_token',
                            refresh_token:  zRefreshToken
                        };
                    });
                    it('returns 400 for missing required field (refresh_token);', function(done) {
                        delete payload.refresh_token;
                        api.post(zRTEndpoint)
                        .type('form')
                        .send(payload)
                        .expect(400)
                        .end(function(err, res) {
                            if(err) return done(err);
                            res.body.should.have.property('error', 'invalid_request');
                            res.body.should.have.property('error_description', 'Missing parameters. \'refresh_token\' is required');
                            done();
                        });
                    });
                    it('returns 400 for invalid refresh_token;', function(done) {
                        payload.refresh_token += 'wrong';
                        api.post(zRTEndpoint)
                        .type('form')
                        .send(payload)
                        .expect(400)
                        .end(function(err, res) {
                            if(err) return done(err);
                            res.body.should.have.property('error', 'invalid_grant');
                            res.body.should.have.property('error_description', 'Invalid refresh token');
                            done();
                        });  
                    });
                    it('returns 200 when all works OK;', function(done) {
                        api.post(zRTEndpoint)
                        .type('form')
                        .send(payload)
                        .expect(200)
                        .end(function(err, res) {
                            if(err) return done(err);
                            res.body.should.have.property('token_type', 'bearer');
                            res.body.should.have.property('access_token');
                            res.body.should.have.property('refresh_token');
                            res.body.should.have.property('expires_in', 900);
                            done();
                        });
                    });
                });
            });   
        });

        describe('Make calls to protected api endpoints:', function() {
            it('fails without access token in the request headers;', function(done) {
                api.get('/api/albums')
                .expect(400)
                .end(function(err, res) {
                    res.body.should.have.property('error', 'invalid_request');
                    res.body.should.have.property('error_description', 'The access token was not found');
                    done();
                });  
            });
            it('fails with invalid access token in the request headers;', function(done) {
                api.get('/api/albums')
                .set('Authorization', 'Bearer ' + access_token + "wrong")
                .expect(401)
                .end(function(err, res) {
                    if(err) return done(err);
                    res.body.should.have.property('error', 'invalid_token');
                    res.body.should.have.property('error_description', 'The access token provided is invalid.');
                    done();
                });  
            });
            it('works well with the token present in headers;', function(done) {
                api.get('/api/albums')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(200, done);   
            });
        });

        describe('Revoke access token:', function() {
            describe('for any client:', function() {
                beforeEach(function(){
                    payload = {
                        client_id:       client.id,
                        client_secret:   client.secret,
                        token_type_hint: 'access_token',
                        token:           access_token
                    };
                });

                it('returns 400 for missing required field (token_type_hint);', function(done) {
                    delete payload.token_type_hint;
                    api.post(revokeEndpoint)
                    .type('form')
                    .send(payload)
                    .expect(400)
                    .end(function(err, res) {
                        if(err) return done(err);
                        res.body.should.have.property('error', 'invalid_request');
                        res.body.should.have.property('error_description', 'Missing parameters. \'token_type_hint\' is required');
                        done();
                    });
                });

                it('returns 400 for invalid required field (token_type_hint);', function(done) {
                    payload.token_type_hint = 'wrong';
                    api.post(revokeEndpoint)
                    .type('form')
                    .send(payload)
                    .expect(400)
                    .end(function(err, res) {
                        if(err) return done(err);
                        res.body.should.have.property('error', 'invalid_request');
                        res.body.should.have.property('error_description', '\'token_type_hint\' parameter value must be either \'refresh_token\' or \'access_token\'');
                        done();
                    });
                });

                it('returns 400 for invalid client credentials;', function(done) {
                    payload.client_id = 'wrong';
                    api.post(revokeEndpoint)
                    .type('form')
                    .send(payload)
                    .expect(400)
                    .end(function(err, res) {
                        if(err) return done(err);
                        res.body.should.have.property('error', 'invalid_client');
                        res.body.should.have.property('error_description', 'Client credentials are invalid');
                        done();
                    });
                });

                it('returns 200 when all is OK!', function(done) {
                    api.post(revokeEndpoint)
                    .type('form')
                    .send(payload)
                    .expect(200, done);
                });
                
            });
        });
    });
});