"use strict";

module.exports = {
  secure: {
    ssl: true,
    privateKey: "./config/sslcerts/key.pem",
    certificate: "./config/sslcerts/cert.pem"
  },
  port: process.env.PORT || 5000,
  host: process.env.HOST || "localhost",
  db: {
    uri: process.env.MONGODB_URI || "mongodb://" + (process.env.DB_HOST ||
      "localhost") + "zProduction",
    credentials: {
      user: "",
      pass: ""
    }
  },
  app: {
    title: "Zinfata App"
  },
  facebook: {
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: "/api/auth/facebook/callback"
  },
  twitter: {
    clientID: process.env.TWITTER_KEY || "CONSUMER_KEY",
    clientSecret: process.env.TWITTER_SECRET || "CONSUMER_SECRET",
    callbackURL: "/api/auth/twitter/callback"
  },
  google: {
    clientID: process.env.GOOGLE_ID || "APP_ID",
    clientSecret: process.env.GOOGLE_SECRET || "APP_SECRET",
    callbackURL: "/api/auth/google/callback"
  },
  linkedin: {
    clientID: process.env.LINKEDIN_ID || "APP_ID",
    clientSecret: process.env.LINKEDIN_SECRET || "APP_SECRET",
    callbackURL: "/api/auth/linkedin/callback"
  },
  github: {
    clientID: process.env.GITHUB_ID || "APP_ID",
    clientSecret: process.env.GITHUB_SECRET || "APP_SECRET",
    callbackURL: "/api/auth/github/callback"
  },
  paypal: {
    clientID: process.env.PAYPAL_ID || "CLIENT_ID",
    clientSecret: process.env.PAYPAL_SECRET || "CLIENT_SECRET",
    callbackURL: "/api/auth/paypal/callback",
    sandbox: true
  }
};
