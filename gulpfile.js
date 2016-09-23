var gulp = require('gulp');
var merge = require('merge2');
var nodemon = require('gulp-nodemon');
var runsequence = require("run-sequence");
var ts = require('gulp-typescript');

var tsProject    = ts.createProject("tsconfig.json");

gulp.task('tsc', function() {
  var tsResult = tsProject.src()
    .pipe(ts(tsProject));

  return merge([ // Run two gulp.dist concurrently (gate condition)
    tsResult.dts.pipe(gulp.dest('built/tds')),
    tsResult.js.pipe(gulp.dest('built'))
  ])
});

gulp.task('tsc:watch', ['tsc'], function() {
  gulp.watch('./src/**/*.ts', ['tsc']);
});

gulp.task('default', ['tsc', 'tsc:watch']);
