// Karma configuration
// Generated on Thu Jan 14 2016 12:30:26 GMT+0100 (CET)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai'],


    // list of files / patterns to load in the browser
    files: [
      'public/zinfataClient/assets/libs/angular-1.4.5/angular.js',
      'public/zinfataClient/assets/libs/angular-1.4.5/angular-mocks.js',
      'public/zinfataClient/assets/libs/angular-1.4.5/angular-resource.js',
      'public/zinfataClient/assets/libs/angular-1.4.5/angular-route.js',
      'public/zinfataClient/assets/libs/angular-1.4.5/angular-messages.js',
      'public/zinfataClient/app/app.module.js',
      'public/zinfataClient/app/**/*.js',
      'test/**/*.spec.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // list of plugins to load
    plugins: ['karma-chai', 'karma-mocha', 'karma-mocha-reporter', 'karma-chrome-launcher'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
