const axios = require('axios');
const AppError = require('../utils/appError');

exports.moderateContent = async (req, res, next) => {
  if (!req.body.text) return next();
  
  try {
    const response = await axios.post(process.env.MODERATION_API_URL, {
      text: req.body.text
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.MODERATION_API_KEY}`
      }
    });

    if (response.data.isToxic) {
      return next(new AppError('Your message contains inappropriate content', 400));
    }

    next();
  } catch (err) {
    console.error('Content moderation failed:', err);
    next(); // Allow to proceed if moderation service fails
  }
};
