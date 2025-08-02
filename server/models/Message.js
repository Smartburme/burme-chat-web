const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  attachments: [{
    type: { type: String, enum: ['image', 'video', 'file'] },
    url: String,
    name: String,
    size: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
