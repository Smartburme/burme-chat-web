const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  },
  type: {
    type: String,
    enum: ['friendRequest', 'message', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedChat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
