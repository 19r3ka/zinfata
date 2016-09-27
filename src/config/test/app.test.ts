import * as chai    from "chai";
import * as chai_p  from "chai-as-promised";
import * as express from "express";
import * as http    from "http";
import * as winston from "winston";

import app = require("../lib/app");

chai.use(chai_p);
const should: Chai.Should = chai.should();

describe("App", () => {

  describe("#start()", () => {

    it("Starts Express app with a listening server", () => {
      return app()
        .should.be.fulfilled
        .and.eventually.have.property("listening", true);
    });

  });
});
