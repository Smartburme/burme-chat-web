import { useState, useEffect } from 'react';
import { List, Avatar, Button, Input, Badge } from 'antd';
import { SearchOutlined, UserAddOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const FriendListPage = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await api.get('/friends');
        setFriends(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAddFriend = async (userId) => {
    try {
      await api.post(`/friends/${userId}`);
      message.success(t('friend_request_sent'));
    } catch (err) {
      message.error(t('friend_request_failed'));
    }
  };

  return (
    <div className="friend-list-page">
      <div className="friend-list-header">
        <h1>{t('friends')}</h1>
        <Input
          placeholder={t('search_friends')}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>

      <List
        loading={loading}
        dataSource={filteredFriends}
        renderItem={(friend) => (
          <List.Item
            className="friend-item"
            actions={[
              <Button 
                type="primary" 
                icon={<UserAddOutlined />}
                onClick={() => handleAddFriend(friend._id)}
              >
                {t('add_friend')}
              </Button>
            ]}
          >
            <List.Item.Meta
              avatar={
                <Badge dot={friend.isOnline}>
                  <Avatar src={friend.profilePicture} />
                </Badge>
              }
              title={friend.name}
              description={friend.isOnline ? t('online') : t('last_seen', { time: friend.lastActive })}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default FriendListPage;
