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
var dbConfig = require('./db.js');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressSession({secret: 'ElYemo'}));
app.use(passport.initialize());
app.use(passport.session());

// Define the routes to use in the app
app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
/*
// CRUD error handler
app.use(function crudErrorHandler(err, req, res, next){
  crudError = new Error('Unable to complete this operation');

  switch(err.name) {
    case 'ValidationError':
      crudError.status = 400;
      crudError.name   = 'Bad Input Parameter';
      break;
    default:
      crudError.status = err.status;
      crudError.name   = err.name;
  }

  crudError.error_details= ''
  for(var key in err.errors) {
    crudError.error_details += err.errors[key].message + ' / ';
  }
  res.status(crudError.status).json(crudError);
  next();
});
*/
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.error(err);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

//Connect to Mongoose (Mongo DB driver)
mongoose.connect(dbConfig.url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connection successful');
});

module.exports = app;
