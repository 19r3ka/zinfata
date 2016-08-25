module.exports = {
  app: {
    title:        'Zinfata',
    description:  'la premiere application web entierement' +
      'dediee a la musique togolaise',
    keywords:     'togo music, musique togolaise',
    GATrackingID: process.env.GA_TRACKING_ID
  },
  devHosts: [
    'localhost',
    '0.0.0.0',
    '127.0.0.1'
  ],
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
      user: process.env.MAILER_EMAIL_ID || 'MAILER_EMAIL_ID',
      pass: process.env.MAILER_EMAIL_PASSWORD || 'MAILER_EMAIL_PASSWORD',
    },
    from: process.env.MAILER_FROM || 'Zinfata',
    service: process.env.MAILER_HOST || 'MAILER_SERVICE_PROVIDER'
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
