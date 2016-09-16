"use strict";

import config = require("../config");

import * as _ from "underscore";
import * as bodyParser from "body-parser";
import * as chalk from "chalk";
import * as compress from "compression";
import * as connectMongo from 'connect-mongo';
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as favicon from "serve-favicon";
import * as helmet from "helmet";
import * as http from "http";
import * as session from "express-session";
import * as path from "path";

const MongoStore = connectMongo(session);

interface ZExpress {
  init()
}

interface ExpressConfigurator {
  (app: express.Express): express.Express;
}

const zExpress: ZExpress = {

}

/* Creates and configures the Express app */
function init(): express.Express {
  const app: express.Express = express();

  initLocalVariables(app)
    ;

  return app;
}

/* Initializes app locals from config variables */
function initLocalVariables(app: express.Express): express.Express {
  // Setting application local variables
  app.locals.audioFolder =    config.uploads.sounds.dest;
  app.locals.cssFiles =       config.files.client.css;
  app.locals.description =    config.app.description;
  app.locals.domain =         config.domain;
  app.locals.env =            process.env.NODE_ENV;
  // app.locals.facebookAppId =  config.facebook.clientID;
  app.locals.favicon =        config.favicon;
  app.locals.GATrackingID =   config.app.GATrackingID;
  app.locals.imageFolder =    config.uploads.images.dest;
  app.locals.keywords =       config.app.keywords;
  app.locals.logo =           config.logo;
  app.locals.jsFiles =        config.files.client.js;
  if (config.secure && config.secure.ssl === true) {
    app.locals.secure = config.secure.ssl;
  }
  app.locals.title =          config.app.title;

  // Passing the request url to environment locals
  app.use((req: express.Request, res: express.Response, next: express.NextFunction): void => {
    res.locals.host = req.protocol + '://' + req.hostname;
    res.locals.url = req.protocol + '://' + req.headers.host + req.originalUrl;
    next();
  });

  return app;
}

/* Initialize application middleware */
function initMiddleware(app: express.Express): express.Express {
  // Should be placed before express.static
  app.use(compress({
    filter: (req, res) => {
      return (/json|text|javascript|css|font|svg/).test(res.getHeader('Content-Type'));
    },
    level: 9
  }));

  // Initialize favicon middleware
  app.use(favicon(app.locals.favicon));

  // Enable logger (morgan) if enabled in the configuration file
  // if (_.has(config, 'log.format')) {
  //   app.use(morgan(logger.getLogFormat(), logger.getMorganOptions()));
  // }

  if (process.env.NODE_ENV === 'development') {
    // Disable views cache
    app.set('view cache', false);
  } else if (process.env.NODE_ENV === 'production') {
    app.locals.cache = 'memory';
  }

  // Request body parsing middleware should be above methodOverride
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());
  // app.use(methodOverride());

  // Add the cookie parser and flash middleware
  app.use(cookieParser());
  // app.use(flash());

  return app;
};

/* Initialize Express Session */
function initSession(app: express.Express, db): express.Express {
  // Express MongoDB session storage
  app.use(session({
    cookie: {
      maxAge: config.sessionCookie.maxAge,
      httpOnly: config.sessionCookie.httpOnly,
      secure: config.sessionCookie.secure && config.secure.ssl
    },
    name: config.sessionKey,
    resave: true,
    saveUninitialized: true,
    secret: config.sessionSecret,
    store: new MongoStore({
      mongooseConnection: db.connection,
      collection: config.sessionCollection
    })
  }));

  return app;
};

/* Initialize View */
function initViewEngine(app: express.Express): express.Express {
  // view engine setup
  app.set('view engine', 'jade');
  app.set('views', path.join(__dirname, 'public/'));

  return app;
}

/* Invoke modules server configuration */
module function initModulesConfiguration(app: express.Express, db) {
  config.files.server.configs.forEach(function (configPath) {
    require(path.resolve(configPath))(app, db);
  });
};


/* Configure Helmet headers configuration */
function initHelmetHeaders(app: express.Express): express.Express {
  // Use helmet to secure Express headers
  const AGE = 15778476000;
  app.use(helmet.frameguard());
  app.use(helmet.xssFilter());
  app.use(helmet.noSniff());
  app.use(helmet.ieNoOpen());
  app.use(helmet.hsts({
    maxAge: AGE,
    includeSubdomains: true,
    force: true
  }));
  app.disable('x-powered-by');

  return app;
};

/**
 * Configure the modules static routes
 */
module.exports.initModulesClientRoutes = function (app) {
  // Setting the app router and static folder
  app.use('/', express.static(path.resolve('./public')));

  // Globbing static routing
  config.folders.client.forEach(function (staticPath) {
    app.use(staticPath, express.static(path.resolve('./' + staticPath)));
  });
};

/**
 * Configure the modules ACL policies
 */
module.exports.initModulesServerPolicies = function (app) {
  // Globbing policy files
  config.files.server.policies.forEach(function (policyPath) {
    require(path.resolve(policyPath)).invokeRolesPolicies();
  });
};

/**
 * Configure the modules server routes
 */
module.exports.initModulesServerRoutes = function (app) {
  // Globbing routing files
  config.files.server.routes.forEach(function (routePath) {
    require(path.resolve(routePath))(app);
  });
};

/**
 * Configure error handling
 */
module.exports.initErrorRoutes = function (app) {
  app.use(function (err, req, res, next) {
    // If the error object doesn't exists
    if (!err) {
      return next();
    }

    // Log it
    console.error(err.stack);

    // Redirect to error page
    res.redirect('/server-error');
  });
};

/**
 * Configure Socket.io
 */
// module.exports.configureSocketIO = function (app, db) {
//   // Load the Socket.io configuration
//   var server = require('./socket.io')(app, db);

//   // Return server object
//   return server;
// };

/**
 * Initialize the Express application
 */
module.exports.init = function (db) {
  // Initialize express app
  var app = express();

  // Initialize local variables
  this.initLocalVariables(app);

  // Initialize Express middleware
  this.initMiddleware(app);

  // Initialize Express view engine
  this.initViewEngine(app);

  // Initialize Helmet security headers
  this.initHelmetHeaders(app);

  // Initialize modules static client routes, before session!
  this.initModulesClientRoutes(app);

  // Initialize Express session
  this.initSession(app, db);

  // Initialize Modules configuration
  this.initModulesConfiguration(app);

  // Initialize modules server authorization policies
  this.initModulesServerPolicies(app);

  // Initialize modules server routes
  this.initModulesServerRoutes(app);

  // Initialize error routes
  this.initErrorRoutes(app);
