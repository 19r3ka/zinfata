"use strict";

export = {
  app: {
    title:        "Zinfata",
    description:  "la première application web entièrement" +
      "dédiée a la musique togolaise",
    keywords:     "Togo music, musique togolaise",
    GATrackingID: process.env.GA_TRACKING_ID
  },
  domain: process.env.DOMAIN,
  port: process.env.PORT || 3000,
  host: process.env.HOST || "localhost",
  logo: "",
  favicon: "",
  oauth2:  {
    accessTokenLifetime:  1800, // 30 minutes
    grants:               ["password", "refresh_token"],
    refreshTokenLifetime: 604800, // 1 week
    clientId:             process.env.Z_CLIENT_ID || "zinfata",
    clientSecret:         process.env.Z_CLIENT_SECRET || "\"pass\""
  },
  admin: {
    firstName: process.env.Z_ADMIN_NAME,
    lastName:  process.env.Z_ADMIN_SURNAME,
    handle:    process.env.Z_ADMIN_HANDLE,
    email:     process.env.Z_ADMIN_EMAIL,
    password:  process.env.Z_ADMIN_PWD,
    role:      process.env.Z_ADMIN_ROLE
  },
  mail:  {
    auth: {
      user: process.env.MAILER_EMAIL_ID || "MAILER_EMAIL_ID",
      pass: process.env.MAILER_EMAIL_PASSWORD || "MAILER_EMAIL_PASSWORD",
    },
    from: process.env.MAILER_FROM || "Zinfata",
    service: process.env.MAILER_HOST || "MAILER_SERVICE_PROVIDER"
  },
  sessionCookie: {
    maxAge: 24 * (60 * 60 * 1000), // TTL 24h
    httpOnly: true, // protection from JS/Browser access
    secure: false // Set to true to only set cookie in https mode
  },
  sessionSecret: process.env.SESSION_SECRET || "ZINFATA", // Never use the default in prod
  // sessionKey is the cookie session name
  sessionKey: "sessionId",
  sessionCollection: "sessions",
  uploads: {
    images: {
      dest: "uploads/images",
      limits: {
        fileSize: 5 * 1024 * 1024
      }
    },
    sounds: {
      dest: "uploads/audio",
      limits: {
        fileSize: 10 * 1024 * 1024
      }
    }
  }
};
