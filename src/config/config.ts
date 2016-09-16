// <reference path="../../typings/index.d.ts" />

/*
 * Ensures the existence of NODE_ENV, global variables and
 * app's essential working folders and files.
*/

"use strict";

import * as _       from "lodash";
import * as chalk   from "chalk";
import * as env     from "dotenv";
import * as fs      from "fs";
import * as glob    from "glob";
import * as path    from "path";
import {Promise}    from "es6-promise";
import * as request from "request";

interface GlobalConfigurator {
  getPathFromGlob(globs: string | string[], excludes?: string | string[]): string[];
  initEnvVariables(environment?: string): Promise<Object>;
  initGlobalConfigFiles(config: any, assets: any): Promise<Object>;
  initGlobalConfigFolders(config: any, assets: any): Promise<Object>;
  init(): Promise<{}>;
  loadAssets(environment: string): Promise<Object>;
  loadEnvVariables(environment: string): Promise<Object>;
  validateDomainIsSet(config: any): Promise<string>;
  validateEnvVariables(environment: string): Promise<Object>;
  validateFilesAndFolders(): Promise<Object>;
  // validateSecureMode(config: any): Boolean;
  validateSessionSecret(config: any, testing?: Boolean): Promise<Boolean>;
  spawnEnvFile(src: string, dest: string): Promise<Object>;
};

interface ConfigValidator {
  message: string;
  file: Boolean;
  node_env?: string;
};

const initializer: GlobalConfigurator = {
  getPathFromGlob,
  init,
  initEnvVariables,
  initGlobalConfigFiles,
  initGlobalConfigFolders,
  loadAssets,
  loadEnvVariables,
  validateDomainIsSet,
  validateEnvVariables,
  validateFilesAndFolders,
  // validateSecureMode,
  validateSessionSecret,
  spawnEnvFile
};

/**
 * Get files by glob patterns
 */
function getPathFromGlob(globs: string | string[], excludes?: string | string[]): string[] {
  // URL paths regex
  const urlRegex = new RegExp("^(?:[a-z]+:)?\/\/", "i");
  let output: string[] = [];

  // GlobPatterns is array?
  if (Array.isArray(globs)) {

    // Recursively search them
    globs.forEach(function (glob) {
      output = _.union(output, getPathFromGlob(glob, excludes));
    });

  // Glob is a string?
  } else if (_.isString(globs)) {
    if (urlRegex.test(globs)) {
      // Push in if it's a valid path
      output.push(globs);
    } else {
      // Get valid path from glob
      let files = glob.sync(globs);

      if (excludes) {

        // Filter out any file marked as exclude
        files = files.map(function (file) {
          if (Array.isArray(excludes)) {
            for (let i in excludes) {
              if (excludes.hasOwnProperty(i)) {
                file = file.replace(excludes[i], "");
              }
            }
          } else {
            file = file.replace(excludes, "");
          }
          return file;
        });
      }
      output = _.union(output, files);
    }
  }

  return output;
};

/*
 * Initializes and returns the global config object
 */

function init(): Promise<{}> {
  validateFilesAndFolders()
    // let user know if something went wrong
    .catch((reasons) => {
      console.log(chalk.yellow(reasons));
      console.log();
    });

    // Config building promise chain
    return validateEnvVariables(process.env.NODE_ENV)
    // Notify if defaulting to dev
    .catch((reason) => {
      console.log(chalk.yellow(reason.message));
    })
    .then(() => {
      // Load confidential global env variables with dotenv
      // Needed to configure/override public global env variables
      return initEnvVariables(process.env.NODE_ENV);
    })
    .then(() => {
      // Load public env and assets environment-specific files
      return Promise.all([
        loadEnvVariables(process.env.NODE_ENV),
        loadAssets(process.env.NODE_ENV)
      ]);
    })
    .then((envVars) => {
      // envVars = [config, assets]
      return Promise.all([
        initGlobalConfigFiles(envVars[0], envVars[1]),
        initGlobalConfigFolders(envVars[0], envVars[1])
      ]);
    })
    .then(([configs1, configs2]) => { // <-- Array destructuring magic, baby!
      // config objects fusion
      const config: any = _.merge(configs1, configs2);

      // Make sure there is a valid domain name for the app
      validateDomainIsSet(config)
        // Notify is it's not
        .catch((warning) => {
          console.log(chalk.yellow(warning));
        });

      // Warn if using default sessionSecret in production
      validateSessionSecret(config)
        .catch((warning) => {
          console.log(chalk.yellow(warning));
        });

      // Add utilities to the GlobalConfig
      config.utils = {
        getPathFromGlob,
        validateSessionSecret
      };

      // Return the final GlobalConfig object
      // Should be autowrapped in a Promise
      return config;
    });
}

/*
 * Loads environment-specific global variables
 * Return a promise containing process.env
 */
function initEnvVariables(environment?: string): Promise<Object> {
  if (environment !== "production") {
    env.config();
  }

  return Promise.resolve(process.env);
}

/**
 * Initialize global configuration files
 */
function initGlobalConfigFiles(config: any, assets: any): Promise<Object> {
  // Appending files
  config.files = {
    server: {},
    client: {}
  };

  // Setting Globbed config files
  config.files.server.configs = getPathFromGlob(assets.server.config);

  // Setting Globbed model files
  config.files.server.models = getPathFromGlob(assets.server.models);

  // Setting Globbed policies files
  config.files.server.policies = getPathFromGlob(assets.server.policies);

  // Setting Globbed route files
  config.files.server.routes = getPathFromGlob(assets.server.routes);

  // Setting Globbed socket files
  // config.files.server.sockets = getPathFromGlob(assets.server.sockets);

  // Setting Globbed css files
  config.files.client.css = getPathFromGlob(assets.client.lib.css, "public/").concat(getPathFromGlob(assets.client.css, ["public/"]));

  // Setting Globbed js files
  config.files.client.js = getPathFromGlob(assets.client.lib.js, "public/").concat(getPathFromGlob(assets.client.js, ["public/"]));

  // Setting Globbed test files
  config.files.client.tests = getPathFromGlob(assets.client.tests);

  return Promise.resolve(config);
};

/**
 * Initialize global configuration files
 */
function initGlobalConfigFolders(config: any, assets: any): Promise<Object> {
  // Appending folder paths
  config.folders = {
    server: {},
    client: {}
  };

  // Setting globbed client paths
  config.folders.client = getPathFromGlob(path.join(process.cwd(), "modules/*/client/"), process.cwd().replace(new RegExp(/\\/g), "/"));

  return Promise.resolve(config);
};

/*
 * Loads global assets
 */
function loadAssets(environment: string): Promise<Object> {
  if (!environment) {
    return Promise.reject("No environment specified!");
  }

  // concat assets
  const assets: Object = _.merge(
    // load default asset variables
    require(path.join(process.cwd(), "built/config/assets/default")),

    // load environment specific assets
    require(path.join(process.cwd(), `built/config/assets/${environment}`))
  );

  return Promise.resolve(assets);
}

/*
 * Loads environment-specific variables
 */
function loadEnvVariables(environment: string): Promise<Object> {
  if (!environment) {
    return Promise.reject("No environment specified!");
  }

  // fuuuuuuuuusion!
  const config: any = _.merge(
    // load default config variables
    require(path.join(process.cwd(), "built/config/env/default")),

    // load environment specific variables
    require(path.join(process.cwd(), `built/config/env/${environment}`))
  );

  config.zinfata = require(path.resolve("./package.json"));

  return Promise.resolve(config);
}

/** Validate config.domain is set
 */
function validateDomainIsSet(config: any): Promise<string> {
  if (!config.domain) {
    return Promise.reject("Warning: config.domain should be set to app's valid domain name.");
  }

  return Promise.resolve(config.domain);
};

/*
 * Makes sure there is a supported NODE ENVIRONMENT defined to run with
 */
function validateEnvVariables(environment: string): Promise<{}> {
  // Loads environment files
  const file: string = path.join(process.cwd(), "built/config/env/" +
    environment + ".js");
  let ret: ConfigValidator = {
    message: `Configuration files found for ${environment}.`,
    file: true,
    node_env: environment
  };

  return new Promise((resolve, reject) => {
    // Check to see if file exists
    fs.stat(file, (err, stats) => {

      // If it doesn't exist
      if (err) {
        // Signal no file found
        ret.file = false;

        if (process.env.NODE_ENV) {
          ret.message = "Error: no configuration files found for " +
            environment + ". Defaulting to dev environment.";
        } else {
          ret.message = "Error: Node environment not defined. " +
            "Defaulting to dev environment.";
        }

        // If no environment files found. Default to development.
        ret.node_env = process.env.NODE_ENV = "development";
        reject(ret);
      } else {

        // No error > file found > NODE_ENV defined > AWESOME!
        resolve(ret);
      }
    });
  });
}

/*
 * Validates .env file and upload folders are present
 */
function validateFilesAndFolders(): Promise<Object> {
  const audioFolder: string  = path.join(process.cwd(), "uploads/audio"),
        envFile: string      = path.join(process.cwd(), ".env"),
        imageFolder: string  = path.join(process.cwd(), "uploads/images"),
        sampleFile: string   = path.join(process.cwd(), ".sample-env"),
        toValidate: string[] = [audioFolder, envFile, imageFolder],
        promises: Promise<{}>[] = [];

  // Cycle through files and folders to validate
  for (let v of toValidate) {
    promises.push(
      new Promise((resolve, reject) => {
        fs.stat(v, (err, stats) => {
          // if it doesn't exist
          if (err) {
            // if envFile,
            if (v === envFile) {
              // create it from .sample-env
              resolve(spawnEnvFile(sampleFile, envFile));
            } else {
              // create the upload directory
              resolve(Promise.resolve(fs.mkdir(v)));
            }
          }
        });
      })
    );
  }

  return Promise.all(promises);
}

/**
 * Validate Secure=true parameter can actually be turned on
 * because it requires certs and key files to be available
 */
function validateSecureMode(config: any): Boolean {

  if (!config.secure || config.secure.ssl !== true) {
    return true;
  }

  const privateKey = fs.existsSync(path.resolve(config.secure.privateKey));
  const certificate = fs.existsSync(path.resolve(config.secure.certificate));

  if (!privateKey || !certificate) {
    // console.log(chalk.red('+ Error: Certificate file or key file is missing, falling back to non-SSL mode'));
    // console.log(chalk.red('  To create them, simply run the following from your shell: sh ./scripts/generate-ssl-certs.sh'));
    // console.log();
    config.secure.ssl = false;
    return false;
  }
};

/**
 * Validate Session Secret parameter is not set to default in production
 */
function validateSessionSecret(config: any, testing?: Boolean): Promise<Boolean> {

  // If not in production, who really cares?
  if (process.env.NODE_ENV !== "production") {
    return Promise.resolve(true);
  }

  // If in production and default sessionSecret...
  if (config.sessionSecret === "ZINFATA") {
    // and not testing...
    if (!testing) {
      // Red Alert!
      return Promise.reject("Warning: sessionSecret should not be default in production. Change it ASAP!");
    }
  }

  // In Production but sessionSecret is not default.
  return Promise.resolve(true);
};

/*
 * Checks for .sample-env and spawns brand-new .env file from it
 */
function spawnEnvFile(src: string, dest: string): Promise<Object> {
  return new Promise((resolve, reject) => {
    fs.stat(src, (err, stat) => {
      let read: NodeJS.ReadableStream,
          write: NodeJS.WritableStream;

      // Abort if no source file found.
      if (err) {
        reject(`Error: Could not locate ${src}`);
      }

      // initialize the read stream
      read = fs.createReadStream(src);

      // Register error listener
      read.on("error", (err: NodeJS.ErrnoException) => {
        reject(`Error: Failed to open ${src}: ${err}`);
      });

      // If we read to end then all went well. Resolve!
      read.on("end", () => resolve(dest));

      // initialize the write stream
      write = fs.createWriteStream(dest);

      write.on("error", (err: NodeJS.ErrnoException) => {
        reject(`Error: Failed to open ${dest}: ${err}`);
      });

      // Here is where the copy happens
      read.pipe(write);
    });
  });
}

let outsource: any;
// exports the whole config object in dev for test purposes
if (process.env.NODE_ENV === "production") {
  outsource = initializer.init();
} else {
  outsource = initializer;
}

export = outsource;
