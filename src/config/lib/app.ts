"use strict";

import * as chalk from "chalk";
import {Promise}  from "es6-promise";

import cfgPromise = require("../config");
import express    = require("./express");
import logPromise = require("./logger");
import mongoose   = require("./mongoose");
import seed       = require("./seed");

/*
 * Initializes Mongoose and Express
 * Returns the app instance
 */
function start(): Promise<any> {
  // function-scope container for db connection
  let db: any;

  return Promise.all([

    // Connect to MongoDB database
    mongoose.connect()
      .then(express.init()),

    // Get the global configuration
    cfgPromise,

    // Get the logger
    logPromise,

    // Load modules" Mongoose models
    mongoose.loadModels()

  ])
    .then(([app, config, logger]) => {

      // Start app by listening on <port> at <host>
      app.listen(config.port, config.host);

      return app;
    });
}

export = start;
