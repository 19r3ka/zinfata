"use strict";

/*
 * Tests the server configuration object
 */

import * as chai    from "chai";
import * as chai_p  from "chai-as-promised";
import * as express from "express";
import * as http    from "http";
import * as winston from "winston";

import globalConfig = require("../config");
import logger       = require("../lib/logger");
import server       = require("../lib/server");

chai.use(chai_p);
const should: Chai.Should = chai.should();

let error: string;

describe("Server", () => {

  describe("#init()", () => {

    it("Rejects with invalid Express Application instance", () => {

      error = `Error: Cannot initialize server with invalid Express application.`;

      return server.init()({})
        .should.be.rejectedWith(error);
    });

    it("Returns a http server.", () => {
      // test with a real express application instance
      const xpress: express.Application = express();

      return server.init()(xpress)
        .should.be.fulfilled
        .and.eventually.respondTo("listen");
    });

  });

  describe("#normalizePort()", () => {

    let port: any = 543,
        error: string;

    it("Rejects when port is an object.", () => {

      port  = {phony: "object"};
      error = `Warning: ${port} is neither a valid pipe or port number.`;

      server.normalizePort(port)
        .should.be.rejectedWith(error);
    });

    it("Rejects when port is negative integer", () => {

      port = -324;
      error = `Warning: ${port} is neither a valid pipe or port number.`;

      server.normalizePort(port)
        .should.be.rejectedWith(error);
    });

    it("Returns a number parsed from string.", () => {
      port = "2345";

      server.normalizePort(port)
        .should.be.fulfilled
        .and.eventually.be.instanceof("number")
        .and.equal(2345);
    });

    it("Returns a string from unparseable string.", () => {
      port = "Clearly a string";

      server.normalizePort(port)
        .should.be.fulfilled
        .and.eventually.be.instanceof("string")
        .and.equal(port.toString());
    });
  });

});
