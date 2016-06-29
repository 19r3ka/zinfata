/* inspired by meanjs's config.js file */

var chalk = require('chalk');
var _     = require('underscore');
var glob  = require('glob');
var path  = require('path');

/*
  TODO: Make sure uploads folders exist or create them;
  TODO: Database must have zinfataClient credentials;
*/

var initGlobalConfig = function() {
  // ensure NODE_ENV is set
  validateEnvVariables();

  // load default asset variables
  var defaultAssets = require(path.join(process.cwd(),
    'config/assets/default'));

  // load environment specific assets
  var envAssets = require(path.join(process.cwd(), 'config/assets/' +
    process.env.NODE_ENV) || {});

  // concat assets
  var asset = _.extend(defaultAssets, envAssets);

  // load default config variables
  var defaultConfig = require(path.join(process.cwd(), 'config/env/default'));

  // load environment specific variables
  var envConfig = require(path.join(process.cwd(), 'config/env/' +
    process.env.NODE_ENV) || {});

  // fuuuuuuuuusion!
  var config = _.extend(defaultConfig, envConfig);

  config.zinfata = require(path.resolve('./package.json'));

  return config;
};

var validateEnvVariables = function() {
  var files = glob.sync('./config/env/' + process.env.NODE_ENV + '.js');
  console.log();
  if (!files.length) {
    if (process.env.NODE_ENV) {
      console.error(chalk.yellow('Error: no configuration files found for ' +
        process.env.NODE_ENV + '. Defaulting to dev environment.'));
    } else {
      console.error(chalk.yellow('Error: Node environment not defined. ' +
        'Defaulting to dev environment.'));
    }
    process.env.NODE_ENV = 'development';
  }

  console.log(chalk.white('')); // reset console colors
};


module.exports = initGlobalConfig();
