const Notification = require('../models/Notification');
const pushNotification = require('./pushNotification');
const socketService = require('./socketService');

exports.createNotification = async (userId, type, content, relatedData = {}) => {
  const notification = await Notification.create({
    user: userId,
    type,
    content,
    ...relatedData
  });

  // Send real-time notification via socket
  const io = socketService.getIO();
  io.to(userId.toString()).emit('newNotification', notification);

  // Send push notification
  await pushNotification.send(userId, {
    title: getNotificationTitle(type),
    body: content
  });

  return notification;
};

function getNotificationTitle(type) {
  const titles = {
    message: 'New Message',
    friendRequest: 'Friend Request',
    friendAccept: 'Friend Request Accepted'
  };
  return titles[type] || 'New Notification';
}
