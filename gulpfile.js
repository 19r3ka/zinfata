var _            = require('underscore');
var del          = require('del');
var runSequence  = require('run-sequence');
var browserSync  = require('browser-sync').create();
var path         = require('path');
var fs           = require('fs');
var md5          = require('MD5');

var gulp         = require('gulp');
var gutil        = require('gulp-util');
var gulpIf       = require('gulp-if');
var concat       = require('gulp-concat');
var inject       = require('gulp-inject');
var imagemin     = require('gulp-imagemin');
var less         = require('gulp-less');
var csscomb      = require('gulp-csscomb');
var autoprefixer = require('gulp-autoprefixer');
var ngAnnotate   = require('gulp-ng-annotate');
var uglify       = require('gulp-uglify');
var minify       = require('gulp-cssmin');
var cache        = require('gulp-cached');
var nodemon      = require('gulp-nodemon');
var rename       = require('gulp-rename');
var replace      = require('gulp-replace');

var defAssets    = require('./config/assets/default');
var prodAssets   = require('./config/assets/production');
var version      = require('./config/config2').zinfata.version;

var dest         = 'public/dist/';
var cssFolder    = 'public/stylesheets/';

var zClient      = 'public/zinfataClient/';
var html         = zClient + 'app/*.jade';
var images       = 'public/images/';
var lessFiles    = cssFolder + 'less/*.less';
var JSFile       = 'zinfata-' + version + '.js';
var CSSFile      = 'zinfata-' + version + '.css';
// For cache-busting purposes, append md5 hash to filename
// hash will change with file content updates
var JSMinFile    = function() {
  return 'zinfata-' + version + '.' + md5(fs.readFileSync(dest +
    'js/' + JSFile, 'utf8')) + '.min.js';
};
var CSSMinFile   = function() {
  return 'zinfata-' + version + '.' + md5(fs.readFileSync(dest +
    'css/' + CSSFile, 'utf8')) + '.min.css';
};

var tagify = function(filePath, file, index, length, targetFile) {
  var newPath = /^\/public\//.test(filePath) ? filePath.replace('public/', '') :
    filePath;
  var tag = (path.extname(newPath) === '.js') ?
    'script(src="' + newPath + '")' :
    'link(rel="stylesheet", href="' + newPath + '")';
  return tag;
};

// Inject compressed CSS and JS file into /dist/index.jade
gulp.task('inject-prod', ['compress', 'clean:index'], function() {
  var zStream      = gulp.src(['public/dist/js/' + JSMinFile(),
    'public/dist/css/' + CSSMinFile()], {read: false});
  var vendorStream = gulp.src(_.flatten(
    [
      prodAssets.client.lib.css,
      prodAssets.client.lib.js,
    ]), {read: false}
  );

  return gulp.src([dest + 'index.jade'])
  .pipe(inject(vendorStream, {starttag: '//- vendors:{{ext}}',
    transform: tagify}))
  .pipe(inject(zStream, {transform: tagify}))
  // Change layout path in new /dist/layout.jade to link to zinfataClient/layout
  .pipe(replace('extends layout', 'extends ../zinfataClient/layout'))
  .pipe(gulp.dest(dest));
});

// Inject dev CSS and JS files into /zinfataClient/index.jade
gulp.task('inject-dev', function() {
  var vendorStream = gulp.src(_.flatten(
    [
      defAssets.client.lib.css,
      defAssets.client.lib.js,
    ]), {read: false}
  );
  var zStream = gulp.src(_.flatten(
    [
      defAssets.client.css,
      _.union([zClient + 'app/app.module.js'],
      defAssets.client.js)
    ]), {read: false}
  );
  return gulp.src(zClient + 'index.jade')
  .pipe(inject(vendorStream, {starttag: '//- vendors:{{ext}}',
    transform: tagify}))
  .pipe(inject(zStream, {transform: tagify}))
  .pipe(gulp.dest(zClient));
});

// Removes dev script and link tags from jade templates
// optimizing for production
gulp.task('replace-html', function() {
  var oldVal;
  var newVal;
  var replaceSrc = function() {
    _.mapObject(defAssets.client.lib, function(uriList, key) {
      _.map(uriList, function(uri, index) {
        oldVal = uri.replace('public/', '');
        // defAssets and prodAssets must have exact key and index mapping
        newVal = prodAssets.client[key][index];
        replace(oldVal, newVal);
      });
    });
  };
  var removeClientCode = function() {
    replace(/script\(src='zinfataClient\/app\/*\)'/g, '');
  };

  return gulp.src([zClient + 'layout.jade', zClient + 'index.jade'])
  .pipe(replaceSrc())
  .pipe(removeClientCode())
  .pipe(gulp.dest(dest));
});

// Uglifies JS and minifies CSS into /dist folder
gulp.task('compress', ['less', 'js'], function() {
  return gulp.src([dest + 'js/' + JSFile, dest + 'css/' + CSSFile])
  // prepare Angular code for uglification
  .pipe(gulpIf('*.js', ngAnnotate()))
  //uglify the javascript
  .pipe(gulpIf('*.js', uglify()))
  .pipe(gulpIf('*.js', rename(JSMinFile())))
  .pipe(gulpIf('*.js', gulp.dest(dest + '/js')))
  //minify the stylesheet
  .pipe(gulpIf('*.css', minify()))
  .pipe(gulpIf('*.css', rename(CSSMinFile())))
  .pipe(gulpIf('*.css', gulp.dest(dest + '/css')));
});

// compress images used to /dist
gulp.task('tinyImg', function() {
  return gulp.src(defAssets.client.img)
  .pipe(cache(imagemin({
    interlaced: true
  })))
  .pipe(gulp.dest(dest + 'img'));
});

// Remove everything from the /dist folder
gulp.task('clean:dist', function() {
  return del.sync(dest);
});

// Remove everything from /dist including image cache
gulp.task('clean:cache', function(cb) {
  return cache.clearAll(cb);
});

// Strip index.jade of all link and script tags
gulp.task('clean:index', function() {
  return gulp.src(zClient + 'index.jade')
  .pipe(replace(/script\(.*\)/g, ''))
  .pipe(replace(/link\(.*\)/g, ''))
  .pipe(gulp.dest(dest));
});

//  Concatenate app .js files
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

// Concatenate vendors .js files
gulp.task('js:vendors', function() {
  console.log(defAssets.client.lib.js);
  return gulp.src(defAssets.client.lib.js)
  .pipe(concat('vendors.js'))
  .pipe(gulp.dest(dest + 'js'));
});

// Concatenate vendors .css files
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
  runSequence(['less', 'nodemon', 'browserSync', 'watch'], cb);
});

gulp.task('build', function(cb) {
  runSequence('clean:dist', ['less', 'js', 'compress', 'tinyImg',
    'inject-prod'], cb);
});
