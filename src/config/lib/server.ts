"use strict";

import config = require("../config");
import logger = require("./logger");

import * as chalk from "chalk";
import * as debug_module from "debug";
import * as http  from "http";
import * as https from "https";
import {Promise}  from "es6-promise";

const cfgPromise: any = process.env.NODE_ENV === "testing" ? config.init() : config,
      logPromise: any = process.env.NODE_ENV === "testing" ? logger.init() : logger;


const serverInstance: any = {
  init,
  normalizePort
};

function init(): any {

  // return a then callback function for chaining
  return (app: any): Promise<http.Server> => {

    if (!(app && "set" in app)) {
      return Promise.reject(`Error: Cannot initialize server with invalid Express application.`);
    }

    return cfgPromise
      .then((config: any) => {
        // Get port from environment and store in Express.
        return normalizePort(config.port)
          .then((port) => {
            app.set("port", port);

            let server: http.Server;

            if (config.secure && config.secure.ssl === true) {
              // server = https.createServer(app);
            } else {
              // Create a new HTTP server
              server = http.createServer(app);
            }

            // Handle server errors
            server.on("error", onError);

            // Listening event handler
            server.on("listening", onListening);

            return Promise.resolve(server);
          });

      });
  };
}

/*
 * Normalizes a port into a number, string, or false.
 */
function normalizePort(val: any): Promise<number | string> {

    const port: number = parseInt(val, 10);
    const reason: string = `Warning: ${val} is neither a valid pipe or port number.`;

    if (isNaN(port)) {
      // named pipe
      return Promise.resolve(val);
    }

    if (port >= 0) {
      // port number
      return Promise.resolve(port);
    }

    return Promise.reject(reason);
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: any, port = "chosen"): void {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string"
    ? "Pipe " + port
    : "Port " + port;

  logPromise
    .then((logger: any) => {
      // handle specific listen errors with friendly messages
      switch (error.code) {
        case "EACCES":
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case "EADDRINUSE":
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
}

/*
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  Promise.all([cfgPromise, logPromise])
    .then(([config, logger]) => {

      console.log(config);
      console.log(logger);

      // Create server URL
      const server: string =
        `${process.env.NODE_ENV === "secure" ? "https://" : "http://"}${config.host}:${config.port}`;

      // Logging initialization
      console.info();
      console.info("-----------------------------");
      logger.info(chalk.green(config.app.title));
      logger.info();
      logger.info(chalk.green("App version: " + config.zinfata.version));
      logger.info(chalk.green("Environment: " + process.env.NODE_ENV));
      logger.info(chalk.green("Database:    " + config.db.uri));
      logger.info(chalk.green("Server:      " + server));
      console.info("-----------------------------");

      // Debug to console
      logger.debug(`app listening on ${config.port}`);
    });
}

// export the whole serverInstance in test mode, otherwise just init()
export = process.env.NODE_ENV === "testing" ? serverInstance : serverInstance.init;
