"use strict";

import * as chalk    from "chalk";
import {Promise}     from "es6-promise";
import * as mongoose from "mongoose";
import * as path     from "path";
import config = require("../config");

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
  // Connect to Mongoose (Mongo DB driver)
  mongoose.connect(config.db.uri);

  // Get the Mongoose Connection instance to return
  const db: mongoose.Connection = mongoose.connection;

  // On error, reject the promise
  db.on("error", (err: mongoose.Error) => {
    console.error(chalk.yellow(`Error: Could not connect to MongoDB: ${err}.`));
  });

  // Once the connection is open, resolve
  db.once("open", () => {
    console.info(chalk.green(`Connection successful to MongoDB.`));
  });

  return Promise.resolve(db);
}

/*
 * Closes Mongoose connections
 */
function disconnect(): Promise<string> {
  return mongoose.disconnect((err) => {
    if (err) {
      return Promise.reject(`Error: Couldn't disconnect from MongoDB: ${err}.`);
    }

    return Promise.resolve("Disconnected from database.");
  });
}

/*
 * Loads all modules' models
 */
function loadModels(): void {
  // Initialize models' mongoose models
  config.files.server.models.forEach((modelPath: string) => {
    require(path.resolve(modelPath));
  });
}

// TODO: export a MongooseLoader instance
export = {
  connect,
  disconnect,
  loadModels
};
