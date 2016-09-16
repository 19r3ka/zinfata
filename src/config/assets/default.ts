"use strict";

module.exports = {
  client: {
    vendors: {
      css: [

      ],
      ga: [
        "https://www.google-analytics.com/analytics.js",
        "https://cdnjs.cloudflare.com/ajax/libs/autotrack/0.6.5/autotrack.js"
      ],
      js: [

      ]
    },
    css: [

    ],
    less: [

    ],
    js: [

    ],
    img: [

    ],
    views: [

    ]
  },
  server: {
    config: ["built/config/**/*.js"],
    gulpConfig: ["gulpfile.js"],
    jsfiles: ["built/config/**/*.js"],
    models: ["built/models/*.js"],
    routes: ["built/routes/*.js"],
    policies: "modules/*/server/policies/*.js",
    views: ["modules/*/server/views/*.jade"]
  }
};

