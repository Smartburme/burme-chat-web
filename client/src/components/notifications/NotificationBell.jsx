import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Popover, List, Avatar } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import api from '../../services/api';

const NotificationBell = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    setupSocketListeners();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    const socket = io();
    socket.on('newNotification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? {...n, isRead: true} : n)
      );
      setUnreadCount(prev => prev - 1);
    } catch (err) {
      console.error(err);
    }
  };

  const content = (
    <List
      loading={loading}
      dataSource={notifications}
      renderItem={item => (
        <List.Item 
          onClick={() => markAsRead(item._id)}
          style={{ cursor: 'pointer' }}
        >
          <List.Item.Meta
            avatar={<Avatar src={item.relatedUser?.profilePicture} />}
            title={item.content}
            description={new Date(item.createdAt).toLocaleString()}
          />
          {!item.isRead && <div className="unread-dot"></div>}
        </List.Item>
      )}
    />
  );

  return (
    <Popover content={content} title={t('notifications')} trigger="click">
      <Badge count={unreadCount}>
        <BellOutlined style={{ fontSize: '20px', cursor: 'pointer' }} />
      </Badge>
    </Popover>
  );
};

export default NotificationBell;
