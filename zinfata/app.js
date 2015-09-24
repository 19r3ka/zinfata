var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var expressSession = require('express-session');

var routes = require('./routes/index');
var users  = require('./routes/users');
var albums = require('./routes/albums');
var tracks = require('./routes/tracks');
var playlists = require('./routes/playlists');

var dbConfig = require('./db.js');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'public/zinfataClient/'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressSession({
  secret: 'ElYemo',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Define the routes to use in the app
app.use('/api/users', users);
app.use('/api/albums', albums);
app.use('/api/tracks', tracks);
app.use('/api/playlists', playlists);
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// custom error handler
app.use(function(err, req, res, next) {
  var caughtIt = false,
      status   = 500,
      message  = 'Something went wrong!',
      details  = '';
  if(err.name === 'ValidationError') {
    caughtIt = true;
    status   = 400;
    message  = 'Bad Input Parameter';
    details  = '';
    for(var key in err.errors) {
      details += err.errors[key].message + '|';
    };
  }
  if(err.message === 'not found' || err.name === 'CastError'){
    caughtIt = true;
    status   = 404;
    message  = 'Item Not Found';
    details  = '';
  }
  if(err.message === 'forbidden'){
    caughtIt = true;
    status   = 403;
    message  = 'Forbidden';
    details  = 'You do not have access to the requested resource!';
  }
  if(/^duplicate/.test(err.message)) {
    caughtIt = true;
    var status  = 400;
    var message = 'Bad Input Parameter';
    var details = '';
    if(/handle$/.test(err.message)) {
      details += 'handle is already in use';
    }
    if(/email$/.test(err.message)) {
      details += 'email is already in use';
    }
  }

  if(caughtIt) {
    error = new Error();
    error.status  = status;
    error.message = message;
    error.details = details;
    console.error(error);
    res.status(error.status).json(error).end;
    return next('route');
  } else {
    return next(err);
  }
});

// catch-all error handler
app.use(function(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500);
  if(app.get('env') !== 'development') {
    delete err.stack;
  }
  res.json(err);
});

//Connect to Mongoose (Mongo DB driver)
mongoose.connect(dbConfig.url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connection successful');
});

module.exports = app;
