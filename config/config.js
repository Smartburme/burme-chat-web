// config/config.js
module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your_strong_jwt_secret_here',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/burmechat',
  REDIS_CONFIG: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  VAPID_KEYS: {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
  }
};
