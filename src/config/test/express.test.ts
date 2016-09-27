"use strict";

/*
 * Tests the Express Application object
 */

import * as chai     from "chai";
import * as chai_p   from "chai-as-promised";
import * as express  from "express";
import * as mongoose from "mongoose";
import * as winston  from "winston";

import zXpress      = require("../lib/express");
import globalConfig = require("../config");

// import globalConfig = require("../config");
// import logger       = require("../lib/logger");
// import mongoose     = require("../lib/mongoose");

chai.use(chai_p);
const should: Chai.Should = chai.should();

/*
  init,
  initErrorRoutes, [done]
  initHelmetHeaders, [done]
  initLocalVariables, [done]
  initMiddleware, [done]
  initModulesClientRoutes, [done]
  initModulesServerConfig, [done]
  initModulesServerPolicies, [done]
  initSession, [done]
  initViewEngine [done]
*/

let app: express.Express;

const localVariables: string[] = [
  "audioFolder", "cssFiles", "description", "domain", "env", "favicon",
  "GATrackingID", "imageFolder", "keywords", "logo", "jsFiles", "title"
];


describe("Express", () => {

  let dbPromise: Promise<mongoose.Connection>;

  before(() => {

    return dbPromise = globalConfig.init()
      .then((config: any) => {
        //  Connect to Mongoose
        mongoose.connect(config.db.uri);

        // Get the Mongoose Connection instance to return
        return mongoose.connection;
      });
  });

  beforeEach((done: MochaDone) => {
    // Reset app variable to brand-new Express application
    app = express();
    done();
  });

  describe.only("#init()", () => {
    it("Initializes Express app and returns a http server", () => {
      return dbPromise
        .then((db: mongoose.Connection) => {
          return zXpress.init(db)
            .should.be.fulfilled
            .and.eventually.itself.respondTo("listen"); // Test fails without the use of 'itself'
        });
    });
  });


  describe("#initErrorRoutes()", () => {

    it("Returns Express app after initializing Error Routes", () => {
      return zXpress.initErrorRoutes()(app)
        .should.be.fulfilled
        .and.have.property("locals");
    });

  });

  describe("#initHelmetHeaders()", () => {

    it("Disables 'x-powered-by' header.", () => {
      return zXpress.initHelmetHeaders()(app)
        .should.be.fulfilled
        .and.eventually.have.deep.property("locals.settings.x-powered-by", false);
    });
  });

  describe("#initLocalVariables()", () => {

    it("Configures app.locals with global config data.", () => {

      return zXpress.initLocalVariables(app)
        .should.be.fulfilled
        .and.eventually.have.deep.property("locals")
        .which.contain.all.keys(localVariables);
    });
  });

  describe("#initMiddleware()", () => {

    it("Set middleware functions onto app.", () => {

      return zXpress.initMiddleware()(app)
        .should.be.fulfilled
        .and.eventually.have.property("locals");
    });
  });

  describe("#initModuleClientRoutes()", () => {

    it("Returns a valid Express app.", () => {

      return zXpress.initModulesClientRoutes()(app)
        .should.be.fulfilled
        .and.eventually.have.property("locals");
    });
  });

  describe("#initModuleServerConfig()", () => {

    it("Returns Express app after loading all modules' configs", () => {

      return dbPromise
        .then((db: mongoose.Connection) => {

          return zXpress.initModulesServerConfig(db)(app)
            .should.be.fulfilled
            .and.eventually.have.property("locals");
        });
    });
  });

  describe("#initModuleServerPolicies()", () => {

    it("Returns Express app after loading all modules' policies", () => {

      return zXpress.initModulesServerPolicies()(app)
        .should.be.fulfilled
        .and.eventually.have.property("locals");
    });
  });

  describe("#initModuleServerRoutes()", () => {

    it("Returns Express app after loading all modules' routes", () => {

      return zXpress.initModulesServerRoutes()(app)
        .should.be.fulfilled
        .and.eventually.have.property("locals");
    });
  });

  describe("#initSession()", () => {

    it("Initializes Express Session.", () => {
      return dbPromise
        .then((db: mongoose.Connection) => {
          return zXpress.initSession(db)(app)
            .should.be.fulfilled
            .and.eventually.have.property("locals");
        });
    });
  });

  describe("#initViewEngine()", () => {

    it("Sets 'Pug' as view engine and public dir for static views.", () => {

      return zXpress.initViewEngine()(app)
        .should.be.fulfilled
        .and.eventually.have.deep.property("settings.view engine", "pug");
    });
  });
});
