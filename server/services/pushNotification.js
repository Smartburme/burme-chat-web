const webpush = require('web-push');
const User = require('../models/User');

// Configure VAPID keys
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.sendPushNotification = async (userId, payload) => {
  try {
    const user = await User.findById(userId).select('pushSubscriptions');
    
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return;
    }

    const notificationPromises = user.pushSubscriptions.map(subscription => {
      return webpush.sendNotification(
        JSON.parse(subscription),
        JSON.stringify(payload)
      ).catch(err => {
        if (err.statusCode === 410) {
          // Remove expired subscription
          user.pushSubscriptions = user.pushSubscriptions.filter(
            sub => sub !== subscription
          );
          return user.save();
        }
        console.error('Push notification failed:', err);
      });
    });

    await Promise.all(notificationPromises);
  } catch (err) {
    console.error('Push notification error:', err);
  }
};
