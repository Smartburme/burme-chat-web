const User = require('../models/User');
const socketService = require('./socketService');

const onlineUsers = new Map();

const updateUserStatus = async (userId, isOnline) => {
  try {
    // Update in database
    await User.findByIdAndUpdate(userId, {
      lastActive: new Date(),
      isOnline
    });

    // Update in memory map
    if (isOnline) {
      onlineUsers.set(userId.toString(), true);
    } else {
      onlineUsers.delete(userId.toString());
    }

    // Broadcast status change to friends
    const user = await User.findById(userId).select('friends');
    const io = socketService.getIO();
    
    user.friends.forEach(friendId => {
      io.to(friendId.toString()).emit('friendStatusChange', {
        userId,
        isOnline
      });
    });
  } catch (err) {
    console.error('Status update failed:', err);
  }
};

const checkUserStatus = (userId) => {
  return onlineUsers.has(userId.toString());
};

module.exports = {
  updateUserStatus,
  checkUserStatus
};
