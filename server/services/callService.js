const Call = require('../models/Call');
const socketService = require('./socketService');

const activeCalls = new Map();

exports.initCallHandling = () => {
  const io = socketService.getIO();

  io.on('connection', (socket) => {
    socket.on('start-call', async ({ callerId, receiverId }) => {
      const call = new Call({ caller: callerId, receiver: receiverId });
      await call.save();
      
      activeCalls.set(call._id.toString(), {
        callerSocket: socket.id,
        receiverSocket: null
      });

      socket.to(receiverId).emit('incoming-call', {
        callId: call._id,
        callerId
      });
    });

    socket.on('accept-call', ({ callId }) => {
      const call = activeCalls.get(callId);
      if (call) {
        call.receiverSocket = socket.id;
        socket.to(call.callerSocket).emit('call-accepted', { callId });
      }
    });

    socket.on('call-signal', ({ callId, ...signal }) => {
      const call = activeCalls.get(callId);
      if (!call) return;

      const targetSocket = socket.id === call.callerSocket 
        ? call.receiverSocket 
        : call.callerSocket;
      
      if (targetSocket) {
        socket.to(targetSocket).emit('call-signal', signal);
      }
    });

    socket.on('end-call', async ({ callId }) => {
      const call = activeCalls.get(callId);
      if (!call) return;

      if (call.receiverSocket) {
        socket.to(call.receiverSocket).emit('call-ended');
      }
      if (call.callerSocket && call.callerSocket !== socket.id) {
        socket.to(call.callerSocket).emit('call-ended');
      }

      await Call.findByIdAndUpdate(callId, { endedAt: new Date() });
      activeCalls.delete(callId);
    });
  });
};
