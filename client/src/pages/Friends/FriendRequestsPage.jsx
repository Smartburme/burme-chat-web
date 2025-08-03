import { useState, useEffect } from 'react';
import { List, Avatar, Button, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const FriendRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await api.get('/friends/requests');
        setRequests(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleResponse = async (requestId, isAccepted) => {
    try {
      await api.patch(`/friends/requests/${requestId}`, { action: isAccepted ? 'accept' : 'reject' });
      setRequests(prev => prev.filter(req => req._id !== requestId));
      message.success(isAccepted ? t('friend_added') : t('request_rejected'));
    } catch (err) {
      message.error(t('request_process_failed'));
    }
  };

  return (
    <div className="friend-requests-page">
      <h1>{t('friend_requests')}</h1>
      
      <List
        loading={loading}
        dataSource={requests}
        renderItem={(request) => (
          <List.Item
            className="request-item"
            actions={[
              <Button 
                type="primary" 
                icon={<CheckOutlined />}
                onClick={() => handleResponse(request._id, true)}
              >
                {t('accept')}
              </Button>,
              <Button 
                danger 
                icon={<CloseOutlined />}
                onClick={() => handleResponse(request._id, false)}
              >
                {t('reject')}
              </Button>
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar src={request.from.profilePicture} />}
              title={request.from.name}
              description={t('sent_request')}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default FriendRequestsPage;
