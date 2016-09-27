"use strict";

/*
 * Tests the Mongoose configuration object
 */

import * as chai    from "chai";
import * as chai_p  from "chai-as-promised";
import * as winston from "winston";

import globalConfig = require("../config");
import logger       = require("../lib/logger");
import mongoose     = require("../lib/mongoose");

chai.use(chai_p);
const should: Chai.Should = chai.should();

let error: string;
const connectionKeys: any = ["base", "collections",
  "models", "config", "replica", "hosts", "host",
  "port", "user", "pass", "name", "options", "otherDbs",
  "_readyState", "_closeCalled", "_hasOpened",
  "_listening", "db", "_events", "_eventsCount"];

// Adapted from http://stackoverflow.com/questions/14458508/node-js-shell-command-execution
function cmd_exec(cmd: string, args?: string[]): void {
  const spawn = require("child_process").spawn,
    child = spawn(cmd, args),
    me = this;

  this.exit = 0;  // Send a cb to set 1 when cmd exits

  child.stdout.on("data", (data: any) => me.stdout += data.toString());
  child.stdout.on("end", () => me.exit = 1);
}

describe("Mongoose", () => {

  describe("#connect()", () => {

    it.skip("Rejects when the Mongo driver is not up", () => {

      error = "connect ECONNREFUSED 127.0.0.1:27017";

      return mongoose.connect()
        .should.be.rejectedWith(error);
    });

    it("Returns a Mongoose connection.", () => {

      return mongoose.connect()
        .should.be.fulfilled
        .and.eventually.contain.all.keys(connectionKeys);
    });

  });

  describe("#disconnect()", () => {

  });

  describe("#loadModels()", () => {

  });

});
