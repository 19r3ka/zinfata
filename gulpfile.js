var _            = require('underscore');
var del          = require('del');
var runSequence  = require('run-sequence');
var browserSync  = require('browser-sync').create();
// var series       = require('stream-series');

var gulp         = require('gulp');
var gutil        = require('gulp-util');
var gulpIf       = require('gulp-if');
var useref       = require('gulp-useref');
// var inject       = require('gulp-inject');
var concat       = require('gulp-concat');
var imagemin     = require('gulp-imagemin');
var less         = require('gulp-less');
var csscomb      = require('gulp-csscomb');
var autoprefixer = require('gulp-autoprefixer');
var uglify       = require('gulp-uglify');
var minify       = require('gulp-cssmin');
var cache        = require('gulp-cached');
var nodemon      = require('gulp-nodemon');
var $sort        = require('gulp-angular-filesort');

var isDev        = true;
var isProd       = false;
var defAssets    = require('./config/assets/default');

var dest         = 'public/dist/';
var cssFolder    = 'public/stylesheets/';

var zClient      = 'public/zinfataClient/';
var html         = zClient + 'app/*.jade';
var images       = 'public/images/';
var lessFiles    = cssFolder + 'less/*.less';

gulp.task('useref', function() {
  return gulp.src(defAssets.client.views)
  .pipe(useref())
  // Only uglify javascript
  // .pipe(gulpIf('*.js', uglify()))
  //  Only minify css
  // .pipe(gulpIf('*.css', minify()))
  .pipe(gulp.dest(dest));
});

gulp.task('tinyImg', function() {
  return gulp.src(defAssets.client.img)
  .pipe(cache(imagemin({
    interlaced: true
  })))
  .pipe(gulp.dest(dest + 'img'));
});

gulp.task('clean:dist', function() {
  return del.sync(dest);
});

gulp.task('clean:cache', function(cb) {
  return cache.clearAll(cb);
});

gulp.task('js', function() {
  var assets = _.union([zClient + 'app/app.module.js'],
      defAssets.client.js);
  console.log(assets);
  return gulp.src(assets)
  .pipe(concat('zinfataApp.js'))
  .pipe($sort())
  .pipe(gulp.dest(dest + 'js/'))
  .pipe(browserSync.reload({
    stream: true
  }));
});

gulp.task('less', function() {
  return gulp.src(defAssets.client.less)
  .pipe(concat('zinfataApp.less'))
  .pipe(less())
  .on('error', function(err) {
    console.error(err.toString());
    this.emit('end');
  })
  .pipe(autoprefixer())
  .pipe(csscomb())
  .pipe(gulp.dest(dest + 'css/'))
  .pipe(browserSync.reload({
    stream: true
  }));
});

gulp.task('browserSync', function() {
  return browserSync.init(null, {
    proxy: 'http://localhost:3000',
    files: ['public/zinfataClient/**/*.*'],
    port: 7000
  });
});

gulp.task('nodemon', function() {
  return nodemon({
    script: 'app.js',
    nodeArgs: ['--debug'],
    ext: 'js, html',
    watch: _.union(defAssets.server.models, defAssets.server.routes,
      defAssets.server.config, defAssets.server.gulpConfig)
  });
});

/*gulp.task('inject-files', function() {
  var vendorAssets = _.union(defAssets.client.lib.js, defAssets.client.lib.css);
  var vendors      = gulp.src(vendorAssets, {read: false});

  var appAssets    = _.union(dest + 'zinfataApp.js', dest + 'zinfataApp.css');
  var app          = gulp.src(appAssets, {read: false});

  return gulp.src(zClient + 'index.jade')
  .pipe(inject(series(vendors, app)))
  .pipe(gulp.dest(zClient));
});*/

gulp.task('watch', ['nodemon', 'browserSync', 'less', 'js'], function() {
  gulp.watch(defAssets.client.less, ['less']);
  gulp.watch(defAssets.client.js, ['js']);
});

gulp.task('default', function(cb) {
  runSequence(['less', 'js', 'nodemon', 'browserSync',
    'watch'], cb);
});

gulp.task('build', function(cb) {
  runSequence('clean:dist', ['less', 'js', 'useref', 'tinyImg'], cb);
});
