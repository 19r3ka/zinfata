var _            = require('underscore');
var del          = require('del');
var runSequence  = require('run-sequence');
var browserSync  = require('browser-sync').create();
var path         = require('path');

var gulp         = require('gulp');
var gutil        = require('gulp-util');
var gulpIf       = require('gulp-if');
var concat       = require('gulp-concat');
var inject       = require('gulp-inject');
var imagemin     = require('gulp-imagemin');
var less         = require('gulp-less');
var csscomb      = require('gulp-csscomb');
var autoprefixer = require('gulp-autoprefixer');
var uglify       = require('gulp-uglify');
var minify       = require('gulp-cssmin');
var cache        = require('gulp-cached');
var nodemon      = require('gulp-nodemon');
var rename       = require('gulp-rename');

var defAssets    = require('./config/assets/default');
var version      = require('./config/config2').zinfata.version;

var dest         = 'public/dist/';
var cssFolder    = 'public/stylesheets/';

var zClient      = 'public/zinfataClient/';
var html         = zClient + 'app/*.jade';
var images       = 'public/images/';
var lessFiles    = cssFolder + 'less/*.less';
var JSFile       = 'zinfata-' + version + '.js';
var CSSFile      = 'zinfata-' + version + '.css';
var JSMinFile    = 'zinfata-' + version + '.min.js';
var CSSMinFile   = 'zinfata-' + version + '.min.css';

gulp.task('inject', function() {
  var tagify = function(filePath, file, index, length, targetFile) {
    var newPath = filePath.replace('public/', '');
    var tag = path.extname(newPath) === '.js' ?
      'script(src="' + newPath + '")' :
      'link(rel="stylesheet", href="' + newPath + '")';
    return tag;
  };

  var srcStream = gulp.src([dest + 'js/zinfataApp.js',
    dest + 'css/zinfataApp.css'], {read: false});

  return gulp.src(zClient + 'index.jade')
  .pipe(inject(srcStream, {transform: tagify}))
  .pipe(gulp.dest(dest));
});

gulp.task('compress', function() {
  return gulp.src([dest + 'js/zinfataApp.js', dest + 'css/zinfataApp.css'])
  //uglify the javascript
  .pipe(gulpIf('*.js', uglify()))
  .pipe(gulpIf('*.js', rename('zinfataApp.min.css')))
  .pipe(gulpIf('*.js', gulp.dest(dest + '/js')))
  //minify the stylesheet
  .pipe(gulpIf('*.css', minify()))
  .pipe(gulpIf('*.css', rename('zinfataApp.min.css')))
  .pipe(gulpIf('*.css', gulp.dest(dest + '/css')));
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
  return gulp.src(assets)
  .pipe(concat(JSFile))
  .pipe(gulp.dest(dest + 'js/'))
  .pipe(browserSync.reload({
    stream: true
  }));
});

gulp.task('js:vendors', function() {
  console.log(defAssets.client.lib.js);
  return gulp.src(defAssets.client.lib.js)
  .pipe(concat('vendors.js'))
  .pipe(gulp.dest(dest + 'js'));
});

gulp.task('css:vendors', function() {
  console.log(defAssets.client.lib.css);
  return gulp.src(defAssets.client.lib.css)
  .pipe(concat('vendors.css'))
  .pipe(gulp.dest(dest + 'css'));
});

gulp.task('less', function() {
  return gulp.src(defAssets.client.less)
  .pipe(concat('zinfata.less'))
  .pipe(less())
  .on('error', function(err) {
    console.error(err.toString());
    this.emit('end');
  })
  .pipe(autoprefixer())
  .pipe(csscomb())
  .pipe(gulp.dest(cssFolder))
  .pipe(rename(CSSFile))
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
  runSequence(['less', 'css:vendors','js', 'js:vendors',
    'nodemon', 'browserSync', 'watch'], cb);
});

gulp.task('build', function(cb) {
  runSequence('clean:dist', ['less', 'js', 'compress', 'tinyImg'], cb);
});
