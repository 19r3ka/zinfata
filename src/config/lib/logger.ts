"use strict";

/*
 * Defines logging all throughout the app
 * Using Winston
 */

import * as _       from "lodash";
import * as chalk   from "chalk";
import * as debug   from "debug";
import * as fs      from "fs";

import * as winston from "winston";
import {Promise}    from "es6-promise";
import config =     require("../config");

// Hack to test functions
// By pointing cfgPromise to init's promise
// like it is in non-test mode
const cfgPromise = process.env.NODE_ENV === "testing" ? config.init() : config;

type MorganFormat = "combined" | "common" | "dev" | "short" | "tiny";
type WinstonLevel = "debug" | "error" | "info" | "verbose" | "warn"; // leave out 'silly'

interface WinstonOptions {
  colorize?: boolean;
  eol?: string;
  filename?: string;
  handleExceptions?: boolean;
  humanReadableUnhandledException?: boolean;
  json?: boolean;
  level?: WinstonLevel;
  maxFiles?: number;
  maxsize?: number;
  showLevel?: boolean;
  tailable?: boolean;
  timestamp?: boolean;
}

interface WinstonInstance {
  getMorganOptions(logger: any): Promise<{}>;
  validateMorganFormat(cfg: any): Promise<{}>;
  stream: {};
}

// Default winston.transport.options to use
const defaultOptions: {} = {
  colorize: true,
  handleExceptions: true,
  humanReadableUnhandledException: true,
  json: true,
  level: "debug",
  showLevel: true,
  tailable: true,
  timestamp: true
};

// Default Winston file transport options
const defaultFileOptions: {} = _.merge(defaultOptions, {
  colorize: false,
  eol: "\n",
  level: "warn"
});


const loggerInstance: any = {
  createLogger,
  enableStreamLogging,
  getFileLoggerConfig,
  getMorganOptions,
  init,
  setupFileLogger,
  validateMorganFormat
};


/*
 * Creates Winston logger instance
 */
function createLogger(options = defaultOptions): Promise<winston.LoggerInstance> {
  // Default Winston transport instance (Console output)
  const defaultTransport: winston.ConsoleTransportInstance =
    new winston.transports.Console(options);

  // Main Winston logger instance
  return Promise.resolve(new (winston.Logger)({
      exitOnError: false,
      transports: [defaultTransport]
    }));
}

/*
 * Allows integration with stream-supporting loggers like Morgan
 * Enables logging Morgan HTTP requests to file
 */
function enableStreamLogging(): any {
  // Return a then callback
  return (logger: any): Promise<any> => {
    logger.stream = {
      write: (msg: string) => {
        logger.info(msg);
      }
    };

    return Promise.resolve(logger);
  };
}

/*
 * Defines Winston options
 * Should be provided from GlobalConfig object
 */
function getFileLoggerConfig(): Function {

  // Return then callback function
  return (config: any): Promise<any> => {

    if (!(config && config.log)) {
      return Promise.reject("Error: No log object provided.");
    }

    if (!(config.log && config.log.fileLogger)) {
      return Promise.reject("Error: FileLogger object not found.");
    }

    // directory path and log file path should exist to configure configOptions
    if (!(config.log.fileLogger.directoryPath && config.log.fileLogger.filename)) {
      return Promise.reject("Error: Couldn't determine desired log file path.");
    }


    // Get the fileLogger object from GlobalConfig
    const configFileLogger = config.log.fileLogger;

    const logPath: string = `${configFileLogger.directoryPath}/${configFileLogger.filename}`,
      useJson: boolean    = configFileLogger.json || false,
      maxFiles: number    = configFileLogger.maxFiles || 2,
      maxSize: number     = configFileLogger.maxsize || 10485760;


    return Promise.resolve({
      filename: logPath,
      dirname: configFileLogger.directoryPath,
      json: useJson,
      maxFiles: maxFiles,
      maxsize: maxSize
    });
  };
};


/*
 * Expose a writable file-logging stream
 * to use as config option for Morgan
 */
function getMorganOptions(logger: any): {} {

  if (logger.stream) {
    return { stream: logger.stream };
  } else {
    return {};
  }

};

/*
 * Instantiate a Winston Logger with optional file transport
 */
function init(): Promise<any> {

  // Let the winston logger enhancement begin
  return createLogger(defaultOptions)

    // Register transport for file logging
    .then(setupFileLogger(defaultFileOptions))

    // Expose stream for Morgan to use
    .then(enableStreamLogging())
    .then((logger: any) => {
      // Enhance logger with Morgan init methods
      logger.getMorganOptions = getMorganOptions;
      logger.validateMorganFormat = validateMorganFormat;

      // Add debug module main function to logger
      logger.inspect = debug("zinfata:server");

      // Reassign the enhanced logger to original instance
      return logger;
    });
}

/*
 * Instantiates disk-logging
 */
function setupFileLogger(fileLoggerOptions: any,
  getLoggerOptions: Function = getFileLoggerConfig): any {

  return (logger: winston.LoggerInstance): Promise<winston.LoggerInstance> => {

    let loggerOptions: any;

    return cfgPromise
      .then(getLoggerOptions())
      .then((configOptions: WinstonOptions) => {

        // Extend default file options with GlobalConfig FileLogger options
        loggerOptions = _.merge(fileLoggerOptions, configOptions);

        // Create new FileTransport instance with
        logger.add(winston.transports.File, loggerOptions);

        // Return enhanced logger
        return Promise.resolve(logger);
      });
  };
}

/*
 * Validate Morgan format
 */
function validateMorganFormat(cfg: Promise<any>): Promise<{}> {
  return cfg
    .then((config: any) => {
      // Get format from config, defaulting to combined
      let format: MorganFormat = config.log && config.log.format ? config.log.format.toString() : "combined";

        // make sure we have a valid format
        if (typeof format !== "MorganFormat") {
          format = "combined";
          Promise.reject(`Warning: Invalid Morgan format detected. Defaulted to ${format}`);
        }

        return Promise.resolve(format);
    });
}

// export the whole loggerInstance in test mode
export = process.env.NODE_ENV === "testing" ? loggerInstance : (loggerInstance.init)();
