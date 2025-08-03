const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error('Authentication error'));
    }

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
};
