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
    configs: ["built/modules/*/server/config/*.js"],
    gulpConfig: ["gulpfile.js"],
    jsfiles: ["built/config/**/*.js"],
    models: ["built/models/*.js"],
    routes: ["built/routes/*.js"],
    policies: "built/modules/*/server/policies/*.js",
    views: ["src/modules/*/server/views/*.jade"]
  }
};

