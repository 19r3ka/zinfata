"use strict";

import config = require("../config");

import * as chai   from "chai";
import * as chai_p from "chai-as-promised";
import {Promise}   from "es6-promise";
import * as fs     from "fs";
import * as path   from "path";

chai.use(chai_p);
const should: Chai.Should = chai.should();

const assetFiles = [
  "built/config/assets/default.js",
  "built/config/assets/development.js",
  "built/config/assets/production.js"
];
const envFiles = [
  "built/config/env/default.js",
  "built/config/env/development.js",
  "built/config/env/production.js"
];
const configKeys: string[] = [
  "app",
  "domain",
  "port",
  "host",
  "logo",
  "favicon",
  "oauth2",
  "admin",
  "mail",
  "uploads",
  "db",
  "mailer",
  "facebook",
  "twitter",
  "google",
  "linkedin",
  "github",
  "paypal",
  "sessionCollection",
  "sessionCookie",
  "sessionKey",
  "sessionSecret",
  "zinfata"
];

const envKeys: string[] = [
  "MAILER_EMAIL_ID",
  "MAILER_EMAIL_PASSWORD",
  "MAILER_HOST",
  "MONGODB_URI",
  "Z_CLIENT_ID",
  "Z_CLIENT_SECRET",
  "Z_ADMIN_NAME",
  "Z_ADMIN_SURNAME",
  "Z_ADMIN_HANDLE",
  "Z_ADMIN_EMAIL",
  "Z_ADMIN_PWD",
  "Z_ADMIN_ROLE"
];

// Tests to write:
// getPathFromGlob, [done]
// // init,
// initEnvVariables, [done]
// initGlobalConfigFiles,
// initGlobalConfigFolders,
// loadAssets,
// loadEnvVariables,
// validateDomainIsSet, [done]
// validateEnvVariables, [done]
// validateFilesAndFolders, [done]
// // validateSecureMode,
// validateSessionSecret, [done]
// spawnEnvFile

describe("Config", () => {

  describe("#getPathFromGlob", () => {

    const globs = ["built/config/assets/*.js", "built/config/env/*.js"];

    it("Finds files matching array of glob patterns.", () => {
      config.getPathFromGlob(globs)
        .should.include.members(assetFiles)
        .and.members(envFiles);
    });

    it("Finds files matching single glob pattern.", () => {
      config.getPathFromGlob(globs[0])
        .should.include.members(assetFiles)
        .and.not.members(envFiles);
    });

    it("Excludes specified files from glob pattern matching.", () => {
      config.getPathFromGlob(globs[0], assetFiles[2])
        .should.include.members([assetFiles[0], assetFiles[1]])
        .and.not.include(assetFiles[2]);
    });
  });

  describe("#initEnvVariables()", () => {

    beforeEach(() => {
      delete process.env.NODE_ENV;
      // To delete keys that the precious test might have set
      for (let k in envKeys) {
        if (process.env[k]) delete process.env[k];
      }
    });

    it("Initializes Env Variables when not in production.", () => {
      return config.initEnvVariables()
        .should.eventually.be.fulfilled
        .and.contain.all.keys(envKeys);
    });

    it("Does not initialize Env Variables when in production.", () => {
      // Set the environment to production
      const e = "production";

      return config.initEnvVariables(e)
        .should.eventually.not.contain.any.keys(envFiles);
    });
  });

  describe.skip("#initGlobalConfigFiles()", () => {

  });

  describe.skip("#initGlobalConfigFolders()", () => {

  });

  describe("#loadAssets()", () => {
    const assets = ["client", "server"];

    it("Rejects call without environment specified", () => {
      return config.loadAssets()
        .should.be.rejectedWith("No environment specified!");
    });

    it("Returns object with environment-specific assets", () => {
      process.env.NODE_ENV = "development";

      return config.loadAssets(process.env.NODE_ENV)
        .should.be.fulfilled
        .and.eventually.contain.all.keys(assets);
    });
  });

  describe("#loadEnvVariables()", () => {
    it("Rejects call without environment specified", () => {
      return config.loadEnvVariables()
        .should.be.rejectedWith("No environment specified!");
    });

    it("Returns object with all environment-specific global config variables", () => {
      return config.loadEnvVariables("development")
        .should.be.fulfilled
        .and.eventually.contain.all.keys(configKeys);
    });
  });

  describe("#validateDomainIsSet()", () => {
    const err: string = "Warning: config.domain should be set to app's valid" +
      " domain name.";
    let mockedConfig: any;

    beforeEach(() => {
      mockedConfig = {domain: "zinfata.com"};
    });

    it("Rejects when !config.domain.", () => {
      // First remove the domain property
      delete mockedConfig.domain;

      return config.validateDomainIsSet(mockedConfig)
        .should.be.rejectedWith(err);
    });

    it("Fulfills when config.domain is set.", () => {
      return config.validateDomainIsSet(mockedConfig)
        .should.be.fulfilled
        .and.become(mockedConfig.domain);
    });
  });

  describe("#validateEnvVariables()", () => {

    beforeEach(() => {
      delete process.env.NODE_ENV;
    });

    it("Defaults to Development environment when none other specified.", () => {
      return config.validateEnvVariables()
        .should.be.rejectedWith({
          message: "Error: Node environment not defined. " +
            "Defaulting to dev environment.",
          file: false,
          node_env: "development"
        });
    });

    it("Finds defined environment's env files.", () => {
      return config.validateEnvVariables("production")
        .should.be.fulfilled
        .and.become({
          message: "Configuration files found for production.",
          file: true,
          node_env: "production"
        });
    });
  });

  describe("#validateFilesAndFolders()", () => {
    const audioFolder: string  = path.join(process.cwd(), "uploads/audio"),
        audioBak: string       = `${audioFolder}_bak`,
        envFile: string        = path.join(process.cwd(), ".env"),
        envBak: string         = `${envFile}_bak`,
        imageFolder: string    = path.join(process.cwd(), "uploads/images"),
        imageBak: string       = `${imageFolder}_bak`;

    // Rename files and folders to prevent overwrite during test
    before(done => {
      fs.stat(audioFolder, (err, stats) => {
        if (!err) {
          fs.rename(audioFolder, audioBak, done);
        } else {
          done();
        }
      });
    });

    before(done => {
      fs.stat(imageFolder, (err, stats) => {
        if (!err) {
          fs.rename(imageFolder, imageBak, done);
        } else {
          done();
        }
      });
    });

    before(done => {
      fs.stat(envFile, (err, stats) => {
        if (!err) {
          fs.rename(envFile, envBak, done);
        } else {
          done();
        }
      });
    });

    // Cleanup: rename back the files and folders
    // After deleting the generic ones the test created
    after(done => {
      fs.stat(audioFolder, (err, stats) => {
        if (!err) {
          fs.rmdir(audioFolder, done);
        } else {
          done();
        }
      });
    });

    after(done => {
      fs.stat(imageFolder, (err, stats) => {
        if (!err) {
          fs.rmdir(imageFolder, done);
        } else {
          done();
        }
      });
    });

    after(done => {
      fs.stat(envFile, (err, stats) => {
        if (!err) {
          fs.unlink(envFile, done);
        } else {
          done();
        }
      });
    });

    after(done => {
      fs.rename(audioBak, audioFolder, done);
    });

    after(done => {
      fs.rename(imageBak, imageFolder, done);
    });

    after(done => {
      fs.rename(envBak, envFile, done);
    });

    it("Asserts that files and folders are unavailable at start.", done => {
      fs.existsSync(audioFolder).should.be.false;
      fs.existsSync(imageFolder).should.be.false;
      fs.existsSync(envFile).should.be.false;

      done();
    });

    it("Method should fulfill.", () => {
      return config.validateFilesAndFolders()
        .should.be.fulfilled;
    });

    it("Asserts that all files and folders are now available.", done => {
      fs.existsSync(audioFolder).should.be.true;
      fs.existsSync(imageFolder).should.be.true;
      fs.existsSync(envFile).should.be.true;

      done();
    });
  });

  describe("#validateSessionSecret()", () => {
    let cfg: any;

    beforeEach(() => {
      cfg = {sessionSecret: "ZINFATA"};
    });

    describe("Allows default session secret...", () => {

      it("in development.", () => {
        process.env.NODE_ENV = "development";

        return config.validateSessionSecret(cfg)
          .should.be.fulfilled
          .and.become(true);
      });

      it("in production with testing flag.", () => {
        process.env.NODE_ENV = "production";

        return config.validateSessionSecret(cfg, "testing")
          .should.be.fulfilled
          .and.become(true);
      });
    });

    it("Disallows default session secret in production", () => {
      const reason: string = "Warning: sessionSecret should not be default " +
        "in production. Change it ASAP!";

      process.env.NODE_ENV = "production";

      return config.validateSessionSecret(cfg)
        .should.be.rejectedWith(reason);
    });

    it("Allows changed session secret in production", () => {
      process.env.NODE_ENV = "production";
      cfg.sessionSecret = "somethingElse";

      return config.validateSessionSecret(cfg)
        .should.be.fulfilled
        .and.become(true);
    });
  });

  describe.only("#init()", () => {
    // Add "utils" as one more key to check after initialization
    configKeys.push("utils");

    it("Returns object with global variables present.", () => {
      return config.init()
        .should.be.fulfilled
        .and.eventually.contain.all.keys(configKeys);
    });
  });
});
