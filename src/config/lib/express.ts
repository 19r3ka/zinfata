/*
 * Initializes the Express instance
 */

"use strict";

import config  = require("../config");
import logger  = require("./logger");
import zServer = require("./server");

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
import * as morgan         from "morgan";
import * as session        from "express-session";
import * as path           from "path";
import {Promise}           from "es6-promise";

// Hack to test functions
// By pointing cfgPromise and to init's promise
// like it is in non-test mode
const cfgPromise: any = process.env.NODE_ENV === "testing" ? config.init() : config,
      logPromise: any = process.env.NODE_ENV === "testing" ? logger.init() : logger,
      server: any     = process.env.NODE_ENV === "testing" ? zServer.init() : zServer;

const MongoStore = connectMongo(session);

interface ExpressConfigurator {
  init(db: any): Promise<express.Express>;
  initErrorRoutes(app: express.Express): Promise<express.Express>;
  initHelmetHeaders(app: express.Express): Promise<express.Express>;
  initLocalVariables(app: express.Express): Promise<express.Express>;
  initMiddleware(app: express.Express): Promise<express.Express>;
  initModulesClientRoutes(app: express.Express): Promise<express.Express>;
  initModulesServerRoutes(): any;
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
  initModulesServerRoutes,
  initSession,
  initViewEngine
};

/**
 *  Creates and configures the Express Application
 *  Returns http server
 */
function init(): any {

  // Returns a promise thenable callback
  return (db: any): Promise<http.Server> => {

    // Define express app
    const app: express.Express = express();

    // Initialize local variables
    return initLocalVariables(app)
      // Initialize app's middleware
      .then(initMiddleware())
      // Enable header security
      .then(initHelmetHeaders())
      // Initialize view engine
      .then(initViewEngine())
      // Initialize modules' static client routes. Must be before session config!
      .then(initModulesClientRoutes())
      // Initialize session
      .then(initSession(db))
      // Configure modules once static assets are available
      .then(initModulesServerConfig(db))
      // Load Access Control Policies for modules' server access
      .then(initModulesServerPolicies())
      // Define routes once policies are set
      .then(initModulesServerRoutes())
      // Define error handling route and logic
      .then(initErrorRoutes())
      // Create http(s) server with express app
      .then(server());
  };
}

/**
 * Configure error handling
 */
function initErrorRoutes(): any {

  return (app: express.Express): Promise<express.Express> => {

    return logPromise
      .then((logger: any) => {

        let errorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
          // If there is no error to handle, pass the request along
          if (!err) {
            return next();
          }

          // Otherwise, log it
          logger.error(err.stack);

          // Redirect to error page
          res.redirect("/server-error");
        };

        app.use(errorHandler);

        return app;
      });
  };
};

/*
 * Configure Helmet headers configuration
 * to secure Express headers
 */
function initHelmetHeaders(): any {

  return (app: express.Express): Promise<express.Express> => {

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
};

/*
 * Initializes app locals from config variables
 */
function initLocalVariables(app: express.Express): Promise<express.Express> {

  return cfgPromise
    .then((config: any) => {
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

      return app;
    });
}

/*
 * Initialize application middleware
 */
function initMiddleware(): any {

  return (app: express.Express): Promise<express.Express> => {

    // Any asset should be compressed to the max
    app.use(compress({
      filter: (req: express.Request, res: express.Response) => {
        return (/json|text|javascript|css|font|svg/).test(res.getHeader("Content-Type"));
      },
      level: 9
    }));

    // Define the body parser
    app.use(bodyParser.urlencoded({
      extended: true
    }));

    app.use(bodyParser.json());

    // Init Method Override
    app.use(methodOverride());

    // Add the cookie parser
    app.use(cookieParser());

    // IMPORTANT: Uncomment once favicon path is set
    // Initialize favicon middleware
    // app.use(favicon(app.locals.favicon));

    if (process.env.NODE_ENV === "development") {
      // Disable views cache in dev
      app.set("view cache", false);
    } else if (process.env.NODE_ENV === "production") {
      app.locals.cache = "memory";
    }

    return Promise.all([cfgPromise, logPromise])
      .then(([config, loggerInstance]) => {

        // Use Morgan if enabled in the configuration file
        if (_.has(config, "log.format")) {
          app.use(morgan(loggerInstance.validateMorganFormat(config), loggerInstance.getMorganOptions(loggerInstance)));
        }

        return app;
      });
  };
};

/**
 * Configure the modules' static routes
 */
function initModulesClientRoutes(): any {

  return (app: express.Express): Promise<express.Express> => {

    // Route app's root to fetch static assets from the public folder
    app.use("/", express.static(path.resolve("./public")));

    return cfgPromise
      .then((config: any) => {
        // Link each asset route to its folder, defined as the static path
        config.folders.client.forEach((staticPath: string) => {
          app.use(staticPath, express.static(path.resolve(`./${staticPath}`)));
        });

        return app;
      });
  };
};

/*
 * Initialize modules' server configuration
 */
function initModulesServerConfig(db: any): any {

  return (app: express.Express): Promise<express.Express> => {

    return cfgPromise
      .then((config: any) => {
        config.files.server.configs.forEach((configPath: string) => {
          require(path.resolve(configPath))(app, db);
        });

        return app;
      });
  };
};

/**
 * Configure the modules ACL policies
 */
function initModulesServerPolicies(): any {

  return (app: express.Express): Promise<express.Express> => {

    return cfgPromise
      .then((config: any) => {
        config.files.server.policies.forEach((policyPath: string) => {
          require(path.resolve(policyPath)).invokeRolesPolicies();
        });

        return app;
      });
  };
};

/**
 * Configure the modules server routes
 */
function initModulesServerRoutes(): any {

  return (app: express.Express): Promise<express.Express> => {

    return cfgPromise
      .then((config: any) => {
        config.files.server.routes.forEach((routePath: string) => {
          require(path.resolve(routePath))(app);
        });

        return app;
      });
  };
};

/*
 * Initialize Express Session
 */
function initSession(db: any): any {

  return (app: express.Express): Promise<express.Express> => {

    return cfgPromise
      .then((config: any) => {
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
            mongooseConnection: db, // db is already the connection instance
            collection: config.sessionCollection
          })
        }));

        return Promise.resolve(app);
      });
  };
};

/*
 * Initialize View Engine and paths
 */
function initViewEngine(): any {

  return (app: express.Express): Promise<express.Express> => {

    const publicDir: string = path.join(process.cwd(), "public/");

    // view engine setup
    app.set("view engine", "pug");
    app.set("views", publicDir);

    return Promise.resolve(app);
  };
}
