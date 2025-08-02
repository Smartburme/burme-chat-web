const rateLimit = require('express-rate-limit');
const AppError = require('../utils/appError');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many login attempts from this IP, please try again later',
  handler: (req, res, next) => {
    next(new AppError('Too many requests from this IP', 429));
  }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // limit each IP to 1000 requests per hour
  message: 'Too many requests from this IP, please try again later'
});

const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

module.exports = {
  authLimiter,
  apiLimiter,
  strictLimiter
};
