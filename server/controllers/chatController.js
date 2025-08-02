const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const AppError = require('../utils/appError');

exports.createChatRoom = async (req, res, next) => {
  try {
    const { participants, isGroup, name } = req.body;
    
    // Private chat validation
    if (!isGroup && participants.length !== 2) {
      return next(new AppError('Private chat requires exactly 2 participants', 400));
    }

    const newRoom = await ChatRoom.create({
      participants,
      isGroup,
      name: isGroup ? name : null,
      createdBy: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: {
        room: newRoom
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { limit = 20, page = 1 } = req.query;

    // Check if user is participant
    const room = await ChatRoom.findOne({
      _id: roomId,
      participants: req.user.id
    });

    if (!room) {
      return next(new AppError('You are not authorized to view this chat', 403));
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({ room: roomId })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name profilePicture');

    res.status(200).json({
      status: 'success',
      results: messages.length,
      data: {
        messages
      }
    });
  } catch (err) {
    next(err);
  }
};
