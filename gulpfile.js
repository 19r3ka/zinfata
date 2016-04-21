var gulp         = require('gulp');
/*var useref     = require('gulp-useref');
var uglify       = require('gulp-uglify');
var imagemin     = require('gulp-imagemin');
var gulpIf       = require('gulp-if');
var del          = require('del');*/
var minify       = require('gulp-cssmin');
var cache        = require('gulp-cached');
var less         = require('gulp-less');
var runSequence  = require('run-sequence');
var nodemon      = require('gulp-nodemon');
var concat       = require('gulp-concat');
var csscomb      = require('gulp-csscomb');
var autoprefixer = require('gulp-autoprefixer');
var browserSync  = require('browser-sync').create();

var zClient      = 'public/zinfataClient/';
var dest         = 'public/dist/';
var cssFolder    = 'public/stylesheets/';
var html         = zClient + 'app/*.jade';
var images       = zClient + 'assets/images/';
var lessFiles    = cssFolder + 'less/*.less';

/*gulp.task('useref', function() {
  return gulp.src(html)
  .pipe(useref())
  // Only minify javascript
  .pipe(gulpIf('*.js', uglify()))
  //  Only minify css
  .pipe(gulpIf('*.css', minify()))
  .pipe(gulp.dest(dest));
});

gulp.task('tinyImg', function() {
  return gulp.src(images + '**.+(png|jpg|jpeg|gif|svg)')
  .pipe(cache(imagemin({
    interlaced: true
  })))
  .pipe(gulp.dest(dest + images));
});

gulp.task('clean:dist', function() {
  return del.sync(dest);
});

gulp.task('clean:cache', function(cb) {
  return cache.clearAll(cb);
});*/

gulp.task('less', function() {
  return gulp.src(lessFiles)
  .pipe(concat('style.less'))
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
  .on('restart', function() {
    console.log('restarting!');
    setTimeout(function() {
      browserSync.reload({
        stream: false
      });
    }, 1000);
  });
});

gulp.task('watch', ['nodemon', 'browserSync', 'less'], function() {
  gulp.watch(lessFiles, ['less']);
});

gulp.task('default', function(cb) {
  runSequence(['less', 'nodemon', 'browserSync', 'watch'], cb);
});

gulp.task('build', function(cb) {
  runSequence('clean:dist', ['less', 'useref', 'images'], cb);
});
