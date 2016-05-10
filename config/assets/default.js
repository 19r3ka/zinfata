module.exports = {
  client: {
    lib: {
      css: [
        'public/lib/bootstrap-3.3.5/css/bootstrap.css',
        'public/lib/font-awesome-4.5.0/css/font-awesome.css',
        'public/lib/ngImgCrop/ng-img-crop.css'
      ],
      js: [
        'public/lib/jquery/jquery-2.1.4.min.js',
        'public/lib/bootstrap-3.3.5/js/bootstrap.js',
        'public/lib/angular-1.4.5/angular.js',
        'public/lib/angular-1.4.5/angular-resource.js',
        'public/lib/angular-1.4.5/angular-route.js',
        'public/lib/angular-1.4.5/angular-messages.js',
        'public/lib/ngImgCrop/ng-img-crop.js'
      ]
    },
    css: [
      'public/stylesheets/*.css'
    ],
    less: [
      'public/stylesheets/less/*.less'
    ],
    js: [
      'public/zinfataClient/app/*.js',
      'public/zinfataClient/**/*Controller.js'
    ],
    img: [
      'public/images/*.png',
      'public/images/*.jpg',
      'public/images/*.jpeg',
      'public/images/*.gif',
      'public/images/*.svg'
    ],
    views: [
      'public/zinfataClient/**/*.jade'
    ]
  },
  server: {
    gulpConfig: ['gulpfile.js'],
    config: ['config/**/*.js'],
    models: ['models/*.js'],
    routes: ['routes/*.js']
  }
};
