const DeviceToken = require('../models/DeviceToken');

exports.registerDevice = async (req, res) => {
  try {
    const { token, platform } = req.body;

    // Check if token already exists
    const existingToken = await DeviceToken.findOne({ token });
    if (existingToken) {
      return res.json({ message: 'Device already registered' });
    }

    // Create new device token
    await DeviceToken.create({
      user: req.user._id,
      token,
      platform
    });

    res.json({ message: 'Device registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.unregisterDevice = async (req, res) => {
  try {
    await DeviceToken.findOneAndDelete({
      user: req.user._id,
      token: req.body.token
    });

    res.json({ message: 'Device unregistered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
