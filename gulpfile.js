var _            = require('underscore');
var autoprefixer = require('gulp-autoprefixer');
var browserSync  = require('browser-sync').create();
var cache        = require('gulp-cached');
var concat       = require('gulp-concat');
var csscomb      = require('gulp-csscomb');
var del          = require('del');
var fs           = require('fs');
var gulp         = require('gulp');
var gulpIf       = require('gulp-if');
var gutil        = require('gulp-util');
var imagemin     = require('gulp-imagemin');
var inject       = require('gulp-inject');
var less         = require('gulp-less');
var localtunnel  = require('localtunnel');
var md5          = require('MD5');
var minify       = require('gulp-cssmin');
var ngAnnotate   = require('gulp-ng-annotate');
var nodemon      = require('gulp-nodemon');
var path         = require('path');
var rename       = require('gulp-rename');
var replace      = require('gulp-replace');
var runSequence  = require('run-sequence');
var pageSpeed    = require('psi');
var uglify       = require('gulp-uglify');

var defAssets    = require('./config/assets/default');
var prodAssets   = require('./config/assets/production');
var version      = require('./config/config').zinfata.version;

var zClient      = 'public/zinfataClient/';
var cssFolder    = 'public/stylesheets/';
var CSSFile      = 'zinfata-' + version + '.css';
var dest         = 'public/dist/';
var html         = zClient + 'app/*.jade';
var images       = 'public/images/';
var JSFile       = 'zinfata-' + version + '.js';
var lessFiles    = cssFolder + 'less/*.less';
var psiKey       = ''; // change this value with Page Speed Insight's API key
var site         = ''; // using heroku local in prod env

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
  // var gaStream = gulp.src(prodAssets.client.lib.ga, {read: false});

  return gulp.src([
    dest + 'index.jade',
    dest + 'comingSoon.jade'
  ])
  // .pipe(inject(gaStream, {starttag: '//- ga:js',
    // transform: tagify}))
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

// Removes Zinfata dev script and link tags from jade templates
// Replaces Vendor CSS and JS with minified versions
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

  return gulp.src([
    zClient + 'layout.jade',
    zClient + 'index.jade',
    zClient + 'app/campaigns/comingSoon/comingSoon.jade'
  ])
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
  return gulp.src([
    zClient + 'index.jade',
    zClient + 'app/campaigns/comingSoon/comingSoon.jade'
  ])
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
  .pipe(browserSync.reload({
    stream: true
  }))
  .pipe(rename(CSSFile))
  .pipe(gulp.dest(dest + 'css/'));
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
    script: './bin/www',
    nodeArgs: ['--debug', '--optimize_for_size', '--max_old_space_size=460',
      '--gc_interval=100'],
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

/* Runs Google's Page Speed Insight against the mobile version of app */
gulp.task('psi-mobile', ['ssl'], function() {
  return pageSpeed(site, {
    // key: key,
    nokey: true,
    strategy: 'mobile'
  }).then(function(data) {
    console.log('Speed score: ' + data.ruleGroups.SPEED.score);
    console.log('Usability score: ' + data.ruleGroups.USABILITY.score);
  });
});

/* Runs Google's Page Speed Insight against the desktop version of app */
gulp.task('psi-desktop', ['ssl'], function() {
  return pageSpeed(site, {
    // key: key,
    nokey: true,
    strategy: 'desktop'
  }).then(function(data) {
    console.log('Speed score: ' + data.ruleGroups.SPEED.score);
  });
});

gulp.task('ssl', function() {
  site = localtunnel(8765, function(err, tunnel) {
    if (err) {
      console.error('could not open the tunnel.');
    }
    console.log('localhost accessible at: ' + tunnel.url);
    return tunnel.url;
  });
  return site;
});

gulp.task('build', function(cb) {
  runSequence('clean:dist', ['less', 'js', 'compress', 'tinyImg',
    'inject-prod'], cb);
});
