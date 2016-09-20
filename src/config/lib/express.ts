/*
 * Initializes the Express instance
 */

"use strict";

import config = require("../config");

import * as _              from "lodash";
import * as bodyParser     from "body-parser";
import * as chalk          from "chalk";
import * as compress       from "compression";
import * as connectMongo   from "connect-mongo";
import * as cookieParser   from "cookie-parser";
import * as express        from "express";
import * as favicon        from "serve-favicon";
import * as helmet         from "helmet";
import * as http           from "http";
import * as methodOverride from "method-override";
import * as session        from "express-session";
import * as path           from "path";
import {Promise}           from "es6-promise";

const MongoStore = connectMongo(session);

interface ExpressConfigurator {
  init(db: any): Promise<express.Express>;
  initErrorRoutes(app: express.Express): Promise<express.Express>;
  initHelmetHeaders(app: express.Express): Promise<express.Express>;
  initLocalVariables(app: express.Express): Promise<express.Express>;
  initMiddleware(app: express.Express): Promise<express.Express>;
  initModulesClientRoutes(app: express.Express): Promise<express.Express>;
  initModulesServerConfig(app: express.Express, db: any): Promise<express.Express>;
  initModulesServerPolicies(app: express.Express): Promise<express.Express>;
  initSession(app: express.Express, db: any): Promise<express.Express>;
  initViewEngine(app: express.Express): Promise<express.Express>;
}

// export the ExpressConfigurator object with all its methods
// TODO: find a way to export the interfaced object itself
export = {
  init,
  initErrorRoutes,
  initHelmetHeaders,
  initLocalVariables,
  initMiddleware,
  initModulesClientRoutes,
  initModulesServerConfig,
  initModulesServerPolicies,
  initSession,
  initViewEngine
};

/**
 *  Creates and configures the Express Application
 */
function init(db: any): Promise<express.Express> {
  // Define express app
  const app: express.Express = express();



  // Initialize local variables
  return initLocalVariables(app)
    .then((app) => {
      // Initialize middleware
      return initMiddleware(app);
    })
    .then((res) => {
      // Initialize security headers
      return initHelmetHeaders(res);
    })
    .then((app) => {
      // Initialize view engine
      return initViewEngine(app);
    })
    .then((app) => {
      // Initialize modules' static client routes //must be before session config!
      return initModulesClientRoutes(app);
    })
    .then((app) => {
      // Initialize session
      return initSession(app, db);
    })
    .then((app) => {
      // Configure modules once static assets are available
      return initModulesServerConfig(app, db);
    })
    .then((app) => {
      // Load Access Control Policies for modules' server access
      return initModulesServerPolicies(app);
    })
    .then((app) => {
      // Define routes once policies are set
      return initModulesServerRoutes(app);
    })
    .then((app) => {
      // Define error handling route and logic
      return initErrorRoutes(app);
    });
}

/**
 * Configure error handling
 */
function initErrorRoutes(app: express.Express): Promise<express.Express> {

  let errorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
    // If there is no error to handle, pass the request along
    if (!err) {
      return next();
    }

    // Otherwise, log it
    console.error(err.stack);

    // Redirect to error page
    res.redirect("/server-error");
  };

  app.use(errorHandler);

  return Promise.resolve(app);
};

/*
 * Configure Helmet headers configuration
 * to secure Express headers
 */
function initHelmetHeaders(app: express.Express): Promise<express.Express> {
  // 6 months
  const AGE = 15800000000;
  app.use(helmet.frameguard());
  app.use(helmet.xssFilter());
  app.use(helmet.noSniff());
  app.use(helmet.ieNoOpen());
  app.use(helmet.hsts({
    maxAge: AGE,
    includeSubdomains: true,
    force: true
  }));

  // Disable 'x-powered-by' setting
  app.disable("x-powered-by");

  return Promise.resolve(app);
};

/*
 * Initializes app locals from config variables
 */
function initLocalVariables(app: express.Express): Promise<express.Express> {
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

  // Captures the app's hostname and request url into environment locals
  app.use((req: express.Request, res: express.Response, next: express.NextFunction): void => {
    res.locals.host = req.protocol + `://${req.hostname}`;
    res.locals.url = req.protocol + `://${req.headers.host}${req.originalUrl}`;
    next();
  });

  return Promise.resolve(app);
}

/* Initialize application middleware */
function initMiddleware(app: express.Express): Promise<express.Express> {
  // Any asset should be compressed to the max
  app.use(compress({
    filter: (req: express.Request, res: express.Response) => {
      return (/json|text|javascript|css|font|svg/).test(res.getHeader("Content-Type"));
    },
    level: 9
  }));

  // Initialize favicon middleware
  app.use(favicon(app.locals.favicon));

  // Enable logger (morgan) if enabled in the configuration file
  // if (_.has(config, 'log.format')) {
  //   app.use(morgan(logger.getLogFormat(), logger.getMorganOptions()));
  // }

  if (process.env.NODE_ENV === "development") {
    // Disable views cache in dev
    app.set("view cache", false);
  } else if (process.env.NODE_ENV === "production") {
    app.locals.cache = "memory";
  }

  // Define the body parser
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());

  // Init Method Override
  app.use(methodOverride());

  // Add the cookie parser
  app.use(cookieParser());

  return Promise.resolve(app);
};

/**
 * Configure the modules' static routes
 */
function initModulesClientRoutes(app: express.Express): Promise<express.Express> {
  // Route app's root to fetch static assets from the public folder
  app.use("/", express.static(path.resolve("./public")));

  // Link each asset route to its folder, defined as the static path
  config.folders.client.forEach((staticPath: string) => {
    app.use(staticPath, express.static(path.resolve(`./${staticPath}`)));
  });

  return Promise.resolve(app);
};

/*
 * Initialize modules' server configuration
 */
function initModulesServerConfig(app: express.Express, db: any): Promise<express.Express> {
  config.files.server.configs.forEach((configPath: string) => {
    require(path.resolve(configPath))(app, db);
  });

  return Promise.resolve(app);
};

/**
 * Configure the modules ACL policies
 */
function initModulesServerPolicies(app: express.Express): Promise<express.Express> {

  config.files.server.policies.forEach((policyPath: string) => {
    require(path.resolve(policyPath)).invokeRolesPolicies();
  });

  return Promise.resolve(app);
};

/**
 * Configure the modules server routes
 */
function initModulesServerRoutes(app: express.Express): Promise<express.Express> {
  // Globbing routing files
  config.files.server.routes.forEach((routePath: string) => {
    require(path.resolve(routePath))(app);
  });

  return Promise.resolve(app);
};

/*
 * Initialize Express Session
 */
function initSession(app: express.Express, db: any): Promise<express.Express> {
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

  return Promise.resolve(app);
};

/*
 * Initialize View Engine and paths
 */
function initViewEngine(app: express.Express): Promise<express.Express> {
  // view engine setup
  app.set("view engine", "pug");
  app.set("views", path.join(__dirname, "public/"));

  return Promise.resolve(app);
}
