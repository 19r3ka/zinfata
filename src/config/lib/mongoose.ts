"use strict";

import * as chalk    from "chalk";
import {Promise}     from "es6-promise";
import * as mongoose from "mongoose";
import * as path     from "path";
import logger     =  require("./logger");
import config     =  require("../config");

// Hack to test functions
// By pointing cfgPromise and to init's promise
// like it is in non-test mode
const cfgPromise: any = process.env.NODE_ENV === "testing" ? config.init() : config,
      logPromise: any = process.env.NODE_ENV === "testing" ? logger.init() : logger;

// Set Promise provider to es2015 native promise API
mongoose.Promise = global.Promise;

interface MongooseLoader {
  connect(): Promise<mongoose.Connection>;
  disconnect(): Promise<string>;
  loadModels(): void;
}

/*
 * Opens a Mongoose connection
 */
function connect(): Promise<mongoose.Connection> {
  // Use the logger instance trapped in a Promise
  return Promise.all([cfgPromise, logPromise])
    .then(([config, logger]) => {

      // Promisify mongoose connect callback function
      return new Promise((resolve, reject) => {

        // Connect to Mongoose (Mongo DB driver)
        mongoose.connect(config.db.uri);

        // Get the Mongoose Connection instance to return
        const db: mongoose.Connection = mongoose.connection;

        logger.debug(db);

        // On error, reject the promise
        db.on("error", reject);

        // Once the connection is open, resolve
        db.once("open", () => resolve(db));
      });

    });
}

/*
 * Closes Mongoose connections
 */
function disconnect(): Promise<string> {
  return mongoose.disconnect((err) => {
    if (err) {
      return Promise.reject(err);
    }

    return Promise.resolve("Disconnected from database.");
  });
}

/*
 * Loads all modules' models
 */
function loadModels(): Promise<void> {
  return cfgPromise
    .then((config: any) => {
      // Initialize models' mongoose models
      config.files.server.models.forEach((modelPath: string) => {
        require(path.resolve(modelPath));
      });
    });
}

// TODO: export a MongooseLoader instance

let mongooseInstance: any = {
  connect,
  disconnect,
  loadModels
};

export = mongooseInstance;
