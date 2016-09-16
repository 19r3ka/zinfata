"use strict";

export = {
  admin: {
    firstName: process.env.Z_ADMIN_NAME,
    lastName:  process.env.Z_ADMIN_SURNAME,
    handle:    process.env.Z_ADMIN_HANDLE,
    email:     process.env.Z_ADMIN_EMAIL,
    password:  process.env.Z_ADMIN_PWD,
    role:      process.env.Z_ADMIN_ROLE
  },
  app: {
    title: "Zinfata",
    description: "La communaute de la musique togolaise en ligne",
    keywords: "Togo music, musique togolaise",
    GATrackingID: process.env.GA_TRACKING_ID
  },
  domain: process.env.DOMAIN,
  favicon: "",
  host: process.env.HOST || "0.0.0.0",
  mailer: {
    from: process.env.MAILER_FROM || "Zinfata",
    options: {
      service: process.env.MAILER_SERVICE_PROVIDER || "MAILER_SERVICE_PROVIDER",
      auth: {
        user: process.env.MAILER_EMAIL_ID || "MAILER_EMAIL_ID",
        pass: process.env.MAILER_PASSWORD || "MAILER_PASSWORD"
      }
    }
  },
  logo: "",
  oauth2:  {
    accessTokenLifetime:  1800, // 30 minutes
    grants:               ["password", "refresh_token"],
    refreshTokenLifetime: 604800, // 1 week
    clientId:             process.env.Z_CLIENT_ID || "zinfata",
    clientSecret:         process.env.Z_CLIENT_SECRET || "\"pass\""
  },
  port: process.env.PORT || 3000,
  sessionCookie: {
    maxAge: 24 * 60 * 60 * 1000, // TTL 24h
    httpOnly: true, // protection from JS/Browser access
    secure: false // Set to true to only set cookie in https mode
  },
  sessionCollection: "sessions",
  sessionKey: "zSId",
  sessionSecret: process.env.SESSION_SECRET || "ZINFATA", // Never use the default in prod
  // sessionKey is the cookie session name
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
