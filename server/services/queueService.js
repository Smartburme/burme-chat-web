const Queue = require('bull');
const Notification = require('../models/Notification');
const socketService = require('./socketService');

const notificationQueue = new Queue('notifications', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

notificationQueue.process(async (job) => {
  const { userId, type, content, relatedUser, relatedChat } = job.data;
  
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      content,
      relatedUser,
      relatedChat
    });

    // Emit real-time notification
    const io = socketService.getIO();
    io.to(userId.toString()).emit('newNotification', notification);

    return notification;
  } catch (err) {
    console.error('Notification processing failed:', err);
    throw err;
  }
});

module.exports = notificationQueue;
