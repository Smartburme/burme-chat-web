const User = require('../models/User');
const Report = require('../models/Report');

exports.banUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isBanned: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update related reports
    await Report.updateMany(
      { reportedUser: user._id, status: 'pending' },
      { status: 'resolved', actionTaken: 'User banned' }
    );

    res.json({ message: 'User banned successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getPlatformStats = async (req, res) => {
  try {
    const [userCount, activeUserCount, bannedUserCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastActive: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }),
      User.countDocuments({ isBanned: true })
    ]);

    res.json({
      userCount,
      activeUserCount,
      bannedUserCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
