const Message = require('../models/Message');
const escapeStringRegexp = require('escape-string-regexp');

exports.searchMessages = async (req, res) => {
  try {
    const { roomId, query } = req.query;
    
    if (!roomId || !query) {
      return res.status(400).json({
        status: 'fail',
        message: 'Room ID and search query are required'
      });
    }

    const searchRegex = new RegExp(escapeStringRegexp(query), 'i');
    
    const messages = await Message.find({
      room: roomId,
      text: searchRegex
    })
    .populate('sender', 'name profilePicture')
    .sort('-createdAt')
    .limit(50);

    res.status(200).json({
      status: 'success',
      results: messages.length,
      data: {
        messages
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to search messages'
    });
  }
};
