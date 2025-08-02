const socketio = require('socket.io');

let io;

exports.init = (server) => {
  io = socketio(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected');

    // Join user to their own room for private messages
    socket.on('registerUser', (userId) => {
      socket.join(userId);
    });

    // Handle joining chat rooms
    socket.on('joinRoom', ({ roomId, userId }) => {
      socket.join(roomId);
      console.log(`User ${userId} joined room ${roomId}`);
    });

    // Handle sending messages
    socket.on('sendMessage', (message) => {
      io.to(message.roomId).emit('newMessage', message);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};

exports.getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
