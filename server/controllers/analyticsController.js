const User = require('../models/User');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');

exports.getPlatformStats = async (req, res) => {
  try {
    const [userCount, activeUserCount, messageCount, roomCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastActive: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }),
      Message.countDocuments(),
      ChatRoom.countDocuments()
    ]);

    const messagesByDay = await Message.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } },
      { $limit: 7 }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        userCount,
        activeUserCount,
        messageCount,
        roomCount,
        messagesByDay
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics data'
    });
  }
};
