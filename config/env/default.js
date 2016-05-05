module.exports = {
  app: {
    title: 'Zinfata',
    description: 'la premiere application web entierement' +
      'dediee a la musique togolaise',
    keywords: 'togo music, musique togolaise',
    GATrackingID: process.env.GA_TRACKING_ID
  },
  port: process.env.port || 3000,
  host: process.env.host || 'localhost',
  logo: '',
  favicon: '',
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
