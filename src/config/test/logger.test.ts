"use strict";

/*
 * Tests the Winston logger
 */

import * as chai    from "chai";
import * as chai_p  from "chai-as-promised";
import * as winston from "winston";

import logger       = require("../lib/logger");
import globalConfig = require("../config");

chai.use(chai_p);
const should: Chai.Should = chai.should();

// Default winston.transport.methods
const defaultMethods: string[] = [
  "error", "warn", "info", "debug", "exitOnError", "level", "transports"
];

// Default error variable
let error: string,

// Default config.init() promise
    cfgPromise: any;

describe("Winston Logger", () => {

  before((done) => {

    // Ask for a global config promise before starting
    cfgPromise = globalConfig.init();
    done();
  });

  describe("#createLogger()", () => {
    it("Returns a valid Winston Logger instance.", () => {
      return logger
        .createLogger()
        .should.be.fulfilled
        .and.eventually.contain.all.keys(defaultMethods);
    });
  });

  describe("#enableStreamLogging()", () => {

    it("Adds 'stream' object to the logger.", () => {
      return logger
        .createLogger()
        .then(logger.enableStreamLogging())
        .should.be.fulfilled
        .and.eventually.have.property("stream");
    });
  });

  describe("#getFileLoggerConfig()", () => {

    it("Rejects calls without configOptions param.", () => {

      error = "Error: No log object provided.";

      return logger
        .getFileLoggerConfig()() // call the returned function from original call
        .should.be.rejectedWith(error);
    });

    it("Rejects configOptions param without 'fileLogger' key.", () => {

      error = "Error: fileLogger object not found.";

      cfgPromise
        .then((config: any) => {

          // delete directoryPath and filename
          delete config.fileLogger;

          return logger
            .getFileLoggerConfig()(config)
            .should.be.rejectedWith(error);
        });
    });

    it("Rejects 'configOptions.fileLogger' object without 'directoryPath' or 'filename' keys.", () => {

      error = "Error: Couldn't determine desired log file path.";

      cfgPromise
        .then((config: any) => {

          // delete directoryPath and filename
          delete config.fileLogger.directoryPath;

          return logger
            .getFileLoggerConfig()(config)
            .should.be.rejectedWith(error);
        });
    });

    it("Returns valid Winston file logger options", () => {

      const flOptionsKeys: string[] = ["filename", "json", "maxFiles", "maxsize"];

      return cfgPromise
        .then(logger.getFileLoggerConfig())
        .should.be.fulfilled
        .and.eventually.contain.all.keys(flOptionsKeys);
    });
  });

  describe("#getMorganOptions", () => {

    it("Returns empty object if Winston doesn't expose stream writing.", () => {

      logger.getMorganOptions({})
        .should.be.empty;
    });

    it("Returns 'stream' object if stream-writing is enabled.", done => {
      logger.createLogger()
        .then((log: any) => {
          logger.getMorganOptions(log)
            .should.have.property("stream");
          done();
        });
    });
  });

  describe("#init()", () => {

    it("Returns zinfata server logger instance", () => {
      logger.init()
        .should.be.fulfilled
        .and.eventually.contain.all.keys(defaultMethods)
        .and.have.property("inspect");
    });
  });

  describe("#setupFileLogger()", () => {

    it("Enables file logging", () => {
      return logger.createLogger()
        .then(logger.setupFileLogger({}))
        .should.be.fulfilled
        .and.eventually.have.deep.property("transports.file");
    });
  });

  describe.skip("#validateMorganFormat()", () => {

  })
});
