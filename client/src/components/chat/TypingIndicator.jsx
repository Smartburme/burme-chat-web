import { useEffect, useState } from 'react';
import { Badge } from 'antd';
import socket from '../../services/socketService';

const TypingIndicator = ({ roomId, currentUserId }) => {
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    const handleTyping = (data) => {
      if (data.roomId === roomId && data.userId !== currentUserId) {
        setTypingUsers(prev => {
          const exists = prev.some(u => u.userId === data.userId);
          return exists ? prev : [...prev, { userId: data.userId, name: data.name }];
        });

        // Remove user after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }, 3000);
      }
    };

    socket.on('user-typing', handleTyping);

    return () => {
      socket.off('user-typing', handleTyping);
    };
  }, [roomId, currentUserId]);

  if (typingUsers.length === 0) return null;

  return (
    <div className="typing-indicator">
      <Badge status="processing" />
      <span>
        {typingUsers.map(u => u.name).join(', ')} 
        {typingUsers.length === 1 ? ' is ' : ' are '}
        typing...
      </span>
    </div>
  );
};

export default TypingIndicator;
