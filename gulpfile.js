var gulp = require('gulp'),
	concat = require('gulp-concat'),
	less = require('gulp-less'),
	rename = require('gulp-rename')
	autoprefixer = require('gulp-autoprefixer'),
	nodemon = require('gulp-nodemon'),
	cssmin = require('gulp-cssmin'),
	runSequence = require('run-sequence'),
	browserSync = require('browser-sync'); 

gulp.task('nodemon', ['watch'], function(){
	var nodeConfig = require('fs').readFileSync('nodemon.json','utf8');
	nodemon(JSON.parse(nodeConfig));	
});

gulp.task('watch', ['compilecss'], function(){
	gulp.watch(['./public/stylesheets/style-css.css', './public/stylesheets/less/*.less'], ['compilecss']);
});

gulp.task('compilecss', function(){
	runSequence('less', 'css');
});
/*
convert all ".less" files under "/stylesheets/less" folder into "style-less.css"
*/
gulp.task('less', function(){

	//console.log('less')
	gulp.src('./public/stylesheets/less/*.less')
	.pipe(concat('style-less.less'))
	.pipe(less())
	.pipe(gulp.dest('./public/stylesheets/'));

});
/*
 cocatenate "style-css.css" and  "style-less-css" to "style.css"
 add vendor prefix to "style.css"
 minify "style.css" to "style.min.css"
 */

gulp.task('css', function(){
	setTimeout( function(){
		gulp.src(['./public/stylesheets/style-less.css', './public/stylesheets/style-css.css'])
		.pipe(concat('style.css'))
		.pipe(autoprefixer())
		.pipe(gulp.dest('./public/stylesheets/'))//--
		.pipe(cssmin())
		.pipe(rename('style.min.css'))
		.pipe(gulp.dest('./public/stylesheets/'))
	}, 1000);

});






gulp.task('browser-sync', ['nodemon'], function(){
	browserSync.init(null, {
		proxy: "http://localhost:3000",
        files: ["public/**/*.*"],//files: ["public/**/*.*"], //,"public/zinfataClient/index.jade", "public/stylesheets/style-css.css","public/zinfataClient/layout.jade","public/stylesheets/style.min.css" 
        browser: "iceweasel",//iceweasel,chromium
        online: true,
        reloadOnRestart: true,
        port: 7000,
	});
});


