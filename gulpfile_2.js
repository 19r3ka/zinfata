var gulp         = require('gulp');
var concat       = require('gulp-concat');
var less         = require('gulp-less');
var jshint       = require('gulp-jshint');
var jscs         = require('gulp-jscs');
var cache        = require('gulp-cached');
var rename       = require('gulp-rename');
var autoprefixer = require('gulp-autoprefixer');
var nodemon      = require('gulp-nodemon');
var cssmin       = require('gulp-cssmin');
var runSequence  = require('run-sequence');
var browserSync  = require('browser-sync').create();

var running      = false;

/*
** Executes cli commands with Gulp
*/
function runCommand(command) {
  return function(cb) {
    exec(command, function(err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      cb(err);
    });
  };
}

/*
** Configures Nodemon as a Gulp task using the nodemon.json settings
*/
gulp.task('nodemon', function() {
  var nodeConfig = require('fs').readFileSync('nodemon.json','utf8');
  var started    = false;
  // nodemon(JSON.parse(nodeConfig))
  return nodemon(require('./nodemon.json'))
  .on('start', function(cb) {
    if (!started) {
      cb();
      started = true;
    }
  })
  .on('restart', function () {
    console.log('restarted!');
  });
  /*.on('restart', function() {
    setTimeout(function() {
      browserSync.reload({
        stream: false
      });
    }, 1000);
  })*/;
});

/*
** Watches custom CSS files and starts 'compilecss' task
*/
gulp.task('watch', ['compilecss'], function() {
  gulp.watch(['./public/stylesheets/style-css.css',
              './public/stylesheets/less/*.less'],
              ['compilecss']);
});

/*
** Start the mongo database
*/
gulp.task('start-mongo', function() {
  return runCommand('mongod');
});

/*
** Compiles CSS by running 'less' and 'css' in sequence
*/
gulp.task('compilecss', function() {
  runSequence('less', 'css');
});

/*
** Convert all '.less' files under '/stylesheets/less' folder into 'style-less.css'
*/
gulp.task('less', function() {
  gulp.src('./public/stylesheets/less/*.less')
  .pipe(concat('style-less.less'))
  .pipe(less())
  .pipe(gulp.dest('./public/stylesheets/'));
});

/*
** cocatenate 'style-css.css' and  'style-less-css' to 'style.css'
** add vendor prefix to 'style.css'
** minify 'style.css' to 'style.min.css'
*/
gulp.task('css', function() {
  setTimeout(function() {
    gulp.src(['./public/stylesheets/style-less.css',
              './public/stylesheets/style-css.css'])
    .pipe(concat('style.css'))
    .pipe(autoprefixer())
    .pipe(gulp.dest('./public/stylesheets/'))//--
    .pipe(cssmin())
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest('./public/stylesheets/'))
    .pipe(browserSync.reload({
      stream: true
    }));;
  }, 1000);
});

/*
** Sets up browser-sync
*/
gulp.task('browser-sync', ['nodemon'], function() {
  return browserSync.init(null, {
    proxy: 'http://localhost:3000',
    files: ['public/zinfataClient/**/*.*'],//files: ['public/**/*.*'], //,'public/zinfataClient/index.jade', 'public/stylesheets/style-css.css','public/zinfataClient/layout.jade','public/stylesheets/style.min.css'
    // browser: ['google chrome'],//iceweasel,chromium
    // online: true,
    // reloadOnRestart: true,
    port: 7000
  });
});

/* Lints the changed files */
gulp.task('lint', function() {
  return gulp.src('./**/*.js')
    .pipe(cache('linting'))
    .pipe(jshint())
    .pipe(jshint.reporter())
    .pipe(jshint.reporter('fail'))
    .pipe(jscs())
    .pipe(jscs.reporter());
});

/*
** Starts the mongo database before nodemon and eventually browser-sync
*/
gulp.task('default', ['browser-sync'], function() {
  gulp.watch(
    ['./public/stylesheets/style-css.css', './public/stylesheets/less/*.less'],
    ['compilecss']
  );
  // gulp.watch('./**/*.js', ['lint']);
});
