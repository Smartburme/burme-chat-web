import { Badge, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import socket from '../../services/socketService';

const UserStatus = ({ userId, lastActive }) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Initial check
    const checkStatus = () => {
      const minutesSinceLastActive = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60);
      setIsOnline(minutesSinceLastActive < 5); // Consider online if active in last 5 minutes
    };

    checkStatus();

    // Listen for real-time updates
    socket.on('friendStatusChange', (data) => {
      if (data.userId === userId) {
        setIsOnline(data.isOnline);
      }
    });

    return () => {
      socket.off('friendStatusChange');
    };
  }, [userId, lastActive]);

  const getStatusTooltip = () => {
    if (isOnline) return 'Online now';
    return `Last seen ${new Date(lastActive).toLocaleString()}`;
  };

  return (
    <Tooltip title={getStatusTooltip()}>
      <Badge 
        status={isOnline ? 'success' : 'default'} 
        className="user-status-badge"
      />
    </Tooltip>
  );
};

export default UserStatus;
