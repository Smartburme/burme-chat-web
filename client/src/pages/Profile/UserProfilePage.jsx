import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, Tabs, Button, message } from 'antd';
import { UserOutlined, EditOutlined, MailOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const { TabPane } = Tabs;

const UserProfilePage = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/users/${userId}`);
        setUser(response.data);
        setIsFriend(response.data.isFriend);
      } catch (err) {
        message.error(t('profile_load_failed'));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleFriendAction = async () => {
    try {
      if (isFriend) {
        await api.delete(`/friends/${userId}`);
        message.success(t('friend_removed'));
      } else {
        await api.post(`/friends/${userId}`);
        message.success(t('friend_request_sent'));
      }
      setIsFriend(!isFriend);
    } catch (err) {
      message.error(t('friend_action_failed'));
    }
  };

  if (loading) return <div className="loading-profile">{t('loading')}...</div>;
  if (!user) return <div className="profile-not-found">{t('profile_not_found')}</div>;

  return (
    <div className="user-profile-page">
      <div className="profile-header">
        <Avatar size={120} src={user.profilePicture} icon={<UserOutlined />} />
        <h1>{user.name}</h1>
        <Button 
          type={isFriend ? 'default' : 'primary'}
          onClick={handleFriendAction}
        >
          {isFriend ? t('remove_friend') : t('add_friend')}
        </Button>
      </div>

      <Tabs defaultActiveKey="1" className="profile-tabs">
        <TabPane tab={t('about')} key="1">
          <div className="profile-section">
            <h3><MailOutlined /> {t('email')}</h3>
            <p>{user.email}</p>
          </div>
          <div className="profile-section">
            <h3>{t('bio')}</h3>
            <p>{user.bio || t('no_bio')}</p>
          </div>
        </TabPane>

        <TabPane tab={t('friends')} key="2">
          <div className="friends-list">
            {user.friends?.length > 0 ? (
              user.friends.map(friend => (
                <div key={friend._id} className="friend-item">
                  <Avatar src={friend.profilePicture} />
                  <span>{friend.name}</span>
                </div>
              ))
            ) : (
              <p>{t('no_friends')}</p>
            )}
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default UserProfilePage;
