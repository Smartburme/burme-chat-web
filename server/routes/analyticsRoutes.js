const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authController = require('../controllers/authController');

router.use(authController.protect, authController.restrictTo('admin'));

router.get('/stats', analyticsController.getPlatformStats);
router.get('/user-activity', analyticsController.getUserActivity);
router.get('/message-trends', analyticsController.getMessageTrends);

module.exports = router;
