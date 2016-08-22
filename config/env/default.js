module.exports = {
  app: {
    title:        'Zinfata',
    description:  'la premiere application web entierement' +
      'dediee a la musique togolaise',
    keywords:     'togo music, musique togolaise',
    GATrackingID: process.env.GA_TRACKING_ID
  },
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  logo: '',
  favicon: '',
  oauth2:  {
    accessTokenLifetime:  900, // 15 minutes
    grants:               ['password', 'refresh_token'],
    model:                require('../../models/OAuth'),
    refreshTokenLifetime: 604800, // 1 week
    clientId:             process.env.Z_CLIENT_ID || 'zinfata',
    clientSecret:         process.env.Z_CLIENT_SECRET || "'pass'"
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
      user: process.env.MAILER_EMAIL_ID,
      pass: process.env.MAILER_EMAIL_PASSWORD
    },
    service: process.env.MAILER_HOST
  },
  uploads: {
    images: {
      dest: 'uploads/images',
      limits: {
        fileSize: 5 * 1024 * 1024
      }
    },
    sounds: {
      dest: 'uploads/audio',
      limits: {
        fileSize: 10 * 1024 * 1024
      }
    },
  }
};
