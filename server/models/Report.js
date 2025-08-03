const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedChat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom'
  },
  reason: {
    type: String,
    required: true,
    enum: ['spam', 'harassment', 'inappropriate', 'other']
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  },
  actionTaken: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
