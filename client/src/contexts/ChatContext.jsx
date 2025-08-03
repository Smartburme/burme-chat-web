import { createContext, useState, useEffect } from 'react';
import socket from '../services/socketService';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [activeRooms, setActiveRooms] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    socket.on('roomListUpdate', (rooms) => {
      setActiveRooms(rooms);
    });

    socket.on('unreadCountUpdate', ({ roomId, count }) => {
      setUnreadCounts(prev => ({ ...prev, [roomId]: count }));
    });

    socket.on('userTyping', ({ roomId, userId, isTyping }) => {
      setTypingUsers(prev => {
        const roomTyping = prev[roomId] || [];
        return {
          ...prev,
          [roomId]: isTyping 
            ? [...roomTyping.filter(id => id !== userId), userId]
            : roomTyping.filter(id => id !== userId)
        };
      });
    });

    return () => {
      socket.off('roomListUpdate');
      socket.off('unreadCountUpdate');
      socket.off('userTyping');
    };
  }, []);

  const value = {
    activeRooms,
    unreadCounts,
    typingUsers,
    joinRoom: (roomId) => socket.emit('joinRoom', roomId),
    leaveRoom: (roomId) => socket.emit('leaveRoom', roomId),
    markAsRead: (roomId) => socket.emit('markAsRead', roomId)
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
