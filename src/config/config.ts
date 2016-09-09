/// <reference path="../../typings/index.d.ts" />

/*
 * Ensures the existence of NODE_ENV, global variables and
 * app's essential working folders and files.
*/

"use strict";

import * as _       from "underscore";
import * as chalk   from "chalk";
import * as env     from "dotenv";
import * as fs      from "fs";
import * as glob    from "glob";
import * as path    from "path";
import * as request from "request";

export interface GlobalConfig {
  initEnvVariables(): Object;
  init(): Object;
  validateEnvVariables(): Object;
  validateFilesAndFolders(): void;
};

export interface ConfigValidator {
  message: string;
  file: Boolean;
  node_env?: string;
};

const globalConfig: GlobalConfig = {
  /* Loads development environment global variables */
  initEnvVariables(): Object {
    // In production / staging, Heroku takes care of it for now
    if (process.env.NODE_ENV !== "production") {
      // load .env file
      env.load();
    }

    return process.env;
  },
  /* Exports basic configuration variables */
  init(): Object {
    // ensure NODE_ENV is set
    this.validateEnvVariables();

    // ensure all required files and folders are there
    this.validateFilesAndFolders();

    // initialize environment variables from .env file
    this.initEnvVariables();

    // load default asset variables
    const defaultAssets = require(path.join(process.cwd(),
      "config/assets/default"));

    // load environment specific assets
    const envAssets = require(path.join(process.cwd(), "config/assets/" +
      process.env.NODE_ENV)) || {};

    // concat assets
    const assets = _.extend(defaultAssets, envAssets);

    // load default config variables
    const defaultConfig = require(path.join(process.cwd(), "config/env/default"));

    // load environment specific variables
    const envConfig = require(path.join(process.cwd(), "config/env/" +
      process.env.NODE_ENV)) || {};

    // fuuuuuuuuusion!
    const config = _.extend(defaultConfig, envConfig);

    config.zinfata = require(path.resolve("./package.json"));

    return config;
  },
  /* Makes sure there is a supported NODE ENVIRONMENT defined to run with */
  validateEnvVariables(): Object {
    // Loads environment files
    const file: string = path.join(process.cwd(), "built/config/env/" +
      process.env.NODE_ENV + ".js");
    let ret: ConfigValidator = {
      message: `Configuration files found for ${process.env.NODE_ENV}.`,
      file: true,
      node_env: process.env.NODE_ENV
    };

    console.log();
    if (!fs.existsSync(file)) {
      ret.file = false;

      if (process.env.NODE_ENV) {
        ret.message = "Error: no configuration files found for " +
          process.env.NODE_ENV + ". Defaulting to dev environment.";
      } else {
        ret.message = "Error: Node environment not defined. " +
          "Defaulting to dev environment.";
      }
      // If no environment files found. Default to development.
      ret.node_env = process.env.NODE_ENV = "development";
      console.log(chalk.yellow(ret.message));
    } else {
      console.log(chalk.green(ret.message));
    }

    console.log(chalk.white("")); // reset console colors

    return ret;
  },
  /* Essential files and folders must be there, else create them */
  validateFilesAndFolders(): void {
    const audioFolder: string  = path.join(process.cwd(), "uploads/audio");
    const envFile: string      = path.join(process.cwd(), ".env");
    const imageFolder: string  = path.join(process.cwd(), "uploads/images");
    const sampleFile: string   = path.join(process.cwd(), ".sample-env");
    const uploadFolder: string = path.join(process.cwd(), "uploads");

    // creates "uploads" folder if it doesn"t exist
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder);
    }

    // Validates or create upload audio folders
    if (!fs.existsSync(audioFolder)) {
      console.error(chalk.yellow("No audio upload folder. Creating that now..."));
      fs.mkdirSync(audioFolder);
      console.info(chalk.green("Audio upload folder created!"));
    }

    // Validates or create upload image folders
    if (!fs.existsSync(imageFolder)) {
      console.error(chalk.yellow("No image upload folder. Creating that now..."));
      fs.mkdirSync(imageFolder);
      console.info(chalk.green("Image upload folder created!"));
    }

    // Validates or create .env file from .sample-env
    if (!fs.existsSync(envFile) && process.env.NODE_ENV !== "production") {
      console.error(chalk.yellow("No .env file. Making one now." +
        " Be sure to configure it with all required credentials."));
      fs.createReadStream(sampleFile).pipe(fs.createWriteStream(envFile));
      console.info(chalk.green(".env file spawned and ready to be loaded."));
    }
  }
};

module.exports = globalConfig.init();
// exports the whole config object in dev for test purposes
if (process.env.NODE_ENV === "development") {
  module.exports = globalConfig;
}
