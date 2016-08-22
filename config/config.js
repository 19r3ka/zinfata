/* inspired by meanjs's config.js file */

var _      = require('underscore');
var chalk  = require('chalk');
var env    = require('dotenv');
var fs     = require('fs');
var glob   = require('glob');
var path   = require('path');
var Client = require(path.join(process.cwd(), 'models/OAuthClient'));
var User   = require(path.join(process.cwd(), 'models/User'));

/* Loads development environment global variables */
/* In production / staging, Heroku takes care of it for now. */
var initEnvVariables = function initEnvVariables() {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  // load .env file
  env.load();
};

/* Configures the server and exports basic configuration variables */
var initGlobalConfig = function initGlobalConfig() {
  // ensure NODE_ENV is set
  validateEnvVariables();

  // ensure all required files and folders are there
  validateFilesAndFolders();

  // initialize environment variables from .env file
  initEnvVariables();

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

  registerClient(config.oauth2.clientId, config.oauth2.clientSecret);
  registerAdmin(config.admin);

  return config;
};

/* If not Obama, someone has to be in charge of this Administration */
var registerAdmin = function registerAdmin (credentials) {
  var admin = {
    handle: credentials.handle,
    email: credentials.email
  };

  User.findOne(admin, function(err, client) {
    if (err) {
      console.log(err);
      return;
    }

    if (client) {
      // if admin is root, all is well
      if (client.role === 'root') {
        console.info(chalk.green(
          client.firstName + ' ' + client.lastName +
          ' is in charge here!'
        ));
        return;
      } else {
        client.activated  = true;
        client.role = 'root';
      }
    } else {
      // no admin? create one asap
      console.error(chalk.yellow('Nobody is in charge here.'));
      console.info(chalk.white('Ending this anarchy...'));

      admin = new User({
        activated: true,
        email:     credentials.email,
        firstName: credentials.firstName,
        handle:    credentials.handle,
        lastName:  credentials.lastName,
        password:  credentials.password,
        role:      credentials.role
      });
    }

    // There is a dirty admin to save now
    admin.save(function (err, poz) {
      if (err) {
        console.error(chalk.yellow('Error swearing in the President of Zinfata!'));
        console.error(err);
      }

      console.info(chalk.green('All hail President ' + poz.firstName));
    });
  });
};

/* Register Zinfata's client app */
var registerClient = function registerClient(id, secret, hostname) {
  var redirectUri = (process.env.NODE_ENV === 'secure' ? 'https://' :
    'http://') + 'zinfata.com' + '/callback';

  Client.getClient(id, secret, function(err, client) {
    if (err) {
      console.error(err);
      return;
    }
    if (client) {
      console.info(chalk.green('zinfataClient is registered!'));
      return;
    }
    console.error(chalk.yellow('ZinfataClient is not registered!'));
    console.info(chalk.white('Registering ZinfataClient...'));
    Client.create({
      clientId:     id,
      clientSecret: secret,
      redirectUri:  redirectUri
    }, function(err, zClient) {
      if (err) {
        console.error(chalk.yellow('Error registering zinfataClient!'));
        console.error(err);
        return;
      }

      console.info(chalk.green('zinfataClient is now registered!'));
    });
  });
};

/* Makes sure there is a NODE ENVIRONMENT defined to run with */
var validateEnvVariables = function validateEnvVariables() {
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

/* Essential files and folders must be there, else create them */
var validateFilesAndFolders = function validateFilesAndFolders() {
  var audioFolder  = path.join(process.cwd(), 'uploads/audio');
  var envFile      = path.join(process.cwd(), '.env');
  var imageFolder  = path.join(process.cwd(), 'uploads/images');
  var sampleFile   = path.join(process.cwd(), '.sample-env');
  var uploadFolder = path.join(process.cwd(), 'uploads');

  // create 'uploads' folder if it doesn't exist
  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
  }
  // Validate or create upload folders
  if (!fs.existsSync(audioFolder)) {
    console.error(chalk.yellow('No audio upload folder. Creating that now...'));
    fs.mkdirSync(audioFolder);
    console.info(chalk.green('Audio upload folder created!'));
  }
  if (!fs.existsSync(imageFolder)) {
    console.error(chalk.yellow('No image upload folder. Creating that now...'));
    fs.mkdirSync(imageFolder);
    console.info(chalk.green('Image upload folder created!'));
  }

  // Validate or create .env file from .sample-env
  if (!fs.existsSync(envFile) && process.env.NODE_ENV !== 'production') {
    console.error(chalk.yellow('No .env file. Making one now.' +
      ' Be sure to configure it with all required credentials.'));
    fs.createReadStream(sampleFile).pipe(fs.createWriteStream(envFile));
    console.info(chalk.green('.env file spawned and ready to be loaded.'));
  }
};

module.exports = initGlobalConfig();
