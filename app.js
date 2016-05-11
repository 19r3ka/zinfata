var wagner = require('wagner-core');
require('./dependencies')(wagner);

var fs             = require('fs');
var express        = require('express');
var compression    = require('compression');
var chalk          = require('chalk');
// var serveStatic    = require('serve-static');
var path           = require('path');
var favicon        = require('serve-favicon');
var logger         = require('morgan');
var cookieParser   = require('cookie-parser');
var bodyParser     = require('body-parser');
var mongoose       = require('mongoose');
// var passport       = require('passport');
var expressSession = require('express-session');
var oauthserver    = require('oauth2-server');

var updateinterceptor        = require('./routes/updateinterceptor')(wagner);
var userstatuschecker        = require('./routes/userstatuschecker')(wagner);
var routes                   = require('./routes/index')(wagner);
var users                    = require('./routes/users')(wagner);//add dependencie
var albums                   = require('./routes/albums')(wagner);
var tracks                   = require('./routes/tracks')(wagner);
var playlists                = require('./routes/playlists')(wagner);
var oauthclients             = require('./routes/oauthclients')(wagner);
var zinfataClientProxy       = require('./routes/zinfataclientproxy')(wagner);
var revoketokens             = require('./routes/revoketokens')(wagner);
var creds                    = require('./routes/getCreds')(wagner);
var oauthinfo                = require('./routes/oauthinfo')(wagner);
var zinfataOAuthErrorHandler = require('./lib/errors/ZinfataOAuthErrorHandler');
var zinfataErrorHandler      = require('./lib/errors/ZinfataErrorHandler');

var config     = wagner.invoke(function(Config) {return Config;});
var config2    = require('./config/config2');
var authConfig = config.oauth2;
var app        = express();

if (!fs.existsSync('./uploads/audio')) {
  fs.mkdirSync('./uploads/audio');
}

if (!fs.existsSync('./uploads/images')) {
  fs.mkdirSync('./uploads/images');
}
//init auth server
app.oauth = oauthserver(authConfig);

// view engine setup
app.set('views', path.join(__dirname, 'public/'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(serveStatic(path.join(__dirname, 'public')));
app.use(expressSession({
  secret: 'ElYemo',
  resave: true,
  saveUninitialized: true
}));
/* Compress all outgoing responses */
app.use(compression());
// app.use(passport.initialize());
// app.use(passport.session());

/* routes required to manage oauth */
app.use('/clients/', oauthclients);
app.post('/oauth2/token', userstatuschecker, app.oauth.grant());
app.use('/oauth2/revoke', revoketokens);
app.use('/oauth2/me', oauthinfo);

//zfclient proxy route
app.use('/zinfataclient', zinfataClientProxy);
// Define the routes to use in the app
app.use('/api/users', users);
app.use('/creds', creds);
app.all(/\/api\/*/, app.oauth.authorise());
app.all('/api/:route/:id', updateinterceptor);
//user must have access token
//app.all('/api/:route/:id',  updateinterceptor, app.oauth.authorise()); //user must have access token
app.use('/api/albums', albums);
app.use('/api/tracks', tracks);
app.use('/api/playlists', playlists);
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  return next(err);
});

// error handlers
app.use(app.oauth.errorHandler());
app.use(zinfataOAuthErrorHandler());
app.use(zinfataErrorHandler());

// catch-all error handler
app.use(function(err, req, res, next) {
  var zinfataOAuthError = require('./lib/errors/ZinfataOAuthError');
  var zinfataError = require('./lib/errors/ZinfataError');
  console.error(err);
  if (!(err instanceof zinfataOAuthError || err instanceof zinfataError)) { //Do not catch zinfata custom errors
    res.status(err.status || 500);
    if (app.get('env') !== 'development') {
      delete err.stack;
    }
    res.json(err);
  }
});

//Connect to Mongoose (Mongo DB driver)
mongoose.connect(config2.db.uri);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', function() {
  console.log(chalk.green('Connection successful to database'));
});

/*app.listen(config2.port, config2.host, function() {*/
var server = (process.env.NODE_ENV === 'secure' ? 'https://' : 'http://') +
  config2.host + ':' + config2.port;

console.log('----');
console.log(chalk.green(config2.app.title));
console.log();
console.log(chalk.green('Environment:     ' + process.env.NODE_ENV));
console.log(chalk.green('Server:          ' + server));
console.log(chalk.green('Database:        ' + config2.db.uri));
console.log(chalk.green('App version:     ' + config2.zinfata.version));
console.log('----');
/*});*/

module.exports = app;
