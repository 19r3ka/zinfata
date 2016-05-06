var _            = require('underscore');
var del          = require('del');
var runSequence  = require('run-sequence');
var browserSync  = require('browser-sync').create();
// var series       = require('stream-series');

var gulp         = require('gulp');
var gutil        = require('gulp-util');
var gulpIf       = require('gulp-if');
var useref       = require('gulp-useref');
var inject       = require('gulp-inject');
var concat       = require('gulp-concat');
var imagemin     = require('gulp-imagemin');
var less         = require('gulp-less');
var csscomb      = require('gulp-csscomb');
var autoprefixer = require('gulp-autoprefixer');
var uglify       = require('gulp-uglify');
var minify       = require('gulp-cssmin');
var cache        = require('gulp-cached');
var nodemon      = require('gulp-nodemon');
// var $sort        = require('gulp-angular-filesort');

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
  .pipe(gulpIf('*.js', uglify()))
  //  Only minify css
  .pipe(gulpIf('*.css', minify()))
  .pipe(gulp.dest(dest));
});

gulp.task('inject-vendors', function() {
  var vendorAssets = _.union(defAssets.client.lib.js, defAssets.client.lib.css);
  var vendors      = gulp.src(vendorAssets, {read: false}, {name: 'vendors'});

  var vendorStream = gulp.src(defAssets.client.lib.css)
      .pipe(concat('vendors.css'))
      .pipe(gulp.dest(dest + 'css'));

  return gulp.src(zClient + 'layout.jade')
  .pipe(inject(vendorStream))
  .pipe(gulp.dest(zClient));
});

gulp.task('inject-own', function() {
  var appAssets    = _.union(dest + 'zinfataApp.js', dest + 'zinfataApp.css');
  var app          = gulp.src(appAssets, {read: false});

  return gulp.src(zClient + 'index.jade')
  .pipe(inject(app))
  .pipe(gulp.dest(zClient));
});

gulp.task('inject-files', ['inject-vendors', 'inject-own']);

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
  return gulp.src(assets)
  .pipe(concat('zinfataApp.js'))
  .pipe(gulp.dest(dest + 'js/'))
  .pipe(browserSync.reload({
    stream: true
  }));
});

gulp.task('js:vendors', function() {
  return gulp.src(defAssets.client.lib.js)
  .pipe(concat('vendors.js'))
  .pipe(gulp.dest(dest + 'js'));
});

gulp.task('css:vendors', function() {
  return gulp.src(defAssets.client.lib.css)
  .pipe(concat('vendors.css'))
  .pipe(gulp.dest(dest + 'css'));
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

gulp.task('watch', ['nodemon', 'browserSync', 'less', 'js'], function() {
  gulp.watch(defAssets.client.less, ['less']);
  gulp.watch(defAssets.client.js, ['js']);
});

gulp.task('default', function(cb) {
  runSequence(['less', 'css:vendors','js', 'js:vendors', 'nodemon',
    'browserSync', 'watch'], cb);
});

gulp.task('build', function(cb) {
  runSequence('clean:dist', ['less', 'js', 'useref', 'tinyImg'], cb);
});
