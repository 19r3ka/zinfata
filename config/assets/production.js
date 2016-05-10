module.exports = {
  client: {
    lib: {
      css: [
        'public/lib/bootstrap-3.3.5/css/bootstrap.min.css',
        'public/lib/font-awesome-4.5.0/css/font-awesome.min.css',
        'public/lib/ngImgCrop/ng-img-crop.css'
      ],
      js: [
        'public/lib/jquery/jquery-2.1.4.min.js',
        'public/lib/bootstrap-3.3.5/js/bootstrap.min.js',
        'public/lib/angular-1.4.5/angular.min.js',
        'public/lib/angular-1.4.5/angular-resource.min.js',
        'public/lib/angular-1.4.5/angular-route.min.js',
        'public/lib/angular-1.4.5/angular-messages.min.js',
        'public/lib/ngImgCrop/ng-img-crop.js'
      ]
    },
    css: [
      'public/dist/zinfata-*.min.min.css'
    ],
    js: [
      'public/dist/zinfata-*.min.min.js'
    ],
    img: [
      'public/dist/images/*.png',
      'public/dist/images/*.jpg',
      'public/dist/images/*.jpeg',
      'public/dist/images/*.gif',
      'public/dist/images/*.svg'
    ]
  }
};
