import { useState, useEffect } from 'react';
import socket from '../services/socketService';
import api from '../services/api';

const useUnreadCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await api.get('/chat/unread-count');
        setUnreadCount(response.data.count);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    fetchUnreadCount();

    socket.on('newMessage', () => {
      setUnreadCount(prev => prev + 1);
    });

    socket.on('markAsRead', ({ roomId }) => {
      setUnreadCount(prev => prev - 1);
    });

    return () => {
      socket.off('newMessage');
      socket.off('markAsRead');
    };
  }, []);

  return unreadCount;
};

export default useUnreadCount;
