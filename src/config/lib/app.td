/// <reference path="../../../typings/index.d.ts" />

'use strict';

import * as chalk from 'chalk';
import config = require("../config");


exports.start = function start() {
  this.init.then(
    function fulfilled(app, db, config) {
      // Start the app by listening on <port> at <host>
      app.listen(config.port, config.host, function () {
        // Create server URL
        var server = (process.env.NODE_ENV === 'secure' ? 'https://' : 'http://') + config.host + ':' + config.port;
        // Logging initialization
        console.log('----');
        console.log(chalk.green(config.app.title));
        console.log();
        console.log(chalk.green('Environment:     ' + process.env.NODE_ENV));
        console.log(chalk.green('Server:          ' + server));
        console.log(chalk.green('Database:        ' + config.db.uri));
        console.log(chalk.green('App version:     ' + config.zinfata.version));
        console.log('----');
      });
    }
  )
}
