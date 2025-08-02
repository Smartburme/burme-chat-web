const mongoose = require('mongoose');

const messageReadSchema = new mongoose.Schema({
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  readAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one read record per message-user pair
messageReadSchema.index({ message: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('MessageRead', messageReadSchema);
