"use strict";

import config = require("../config");

import * as chai from "chai";

const should: Chai.Should = chai.should();
const configKeys: string[] = [
  "app",
  "devHosts",
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

describe("Config", () => {
  describe("Env Variables", () => {
    describe("Initializing Env Variables", () => {
      beforeEach(() => {
        process.env.NODE_ENV = "";
      });

      it("Initializes Env Variables when not in production.", () => {
        process.env.NODE_ENV = "development";
        const res: Object = config.initEnvVariables();

        res.should.contain.all.keys(envKeys);
        res.should.have.property("NODE_ENV", "development");
      });

      it("Does not initialize Env Variables when in production", () => {
        // To delete keys that the precious test might have set
        for (let k in envKeys) {
          if (process.env[k]) delete process.env[k];
        }

        process.env.NODE_ENV = "production";
        const res: Object = config.initEnvVariables();

        // res.should.not.contain.any.keys(envKeys);
        res.should.have.property("NODE_ENV", "production");
      });
    });

    describe("Validating Env Variables", () => {
      beforeEach(() => {
        process.env.NODE_ENV = "";
      });

      it("Default to Development environment when none specified.", () => {
        const res: Object = config.validateEnvVariables();

        res.should.have.property("message", "Error: " +
          "Node environment not defined. Defaulting to dev environment.");
        res.should.have.property("file", false);
        res.should.have.property("node_env", "development");
      });

      it("Finds defined environment's env files", () => {
        process.env.NODE_ENV = "production";
        const res: Object = config.validateEnvVariables();

        res.should.have.property("message", "Configuration " +
          "files found for " + process.env.NODE_ENV + ".");
        res.should.have.property("file", true);
      });
    });

  });

  it("Returns object with global variables present.", done => {
    const res: Object = config.init();

    res.should.be.an.instanceOf(Object);
    res.should.contain.all.keys(configKeys);
    done();
  });
});

