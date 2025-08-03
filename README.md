ကျေးဇူးပြု၍ Burme Chat Project အတွက် pages/ ထဲရှိ ကျန်ရှိသော component များကို ဖြည့်စွက်ရေးသားပေးပါမည်။

## 1. Auth Pages

### client/src/pages/Auth/LoginPage.jsx
```javascript
import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await authService.login(values);
      message.success(t('login_success'));
      navigate('/');
    } catch (err) {
      message.error(err.response?.data?.message || t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{t('login')}</h1>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('email_required') },
              { type: 'email', message: t('invalid_email') }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder={t('email')} />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('password_required') }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('password')} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t('login')}
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-links">
          <Link to="/register">{t('register_now')}</Link>
          <Link to="/forgot-password">{t('forgot_password')}</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
```

### client/src/pages/Auth/RegisterPage.jsx
```javascript
import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useTranslation } from 'react-i18next';

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await authService.register(values);
      message.success(t('register_success'));
      navigate('/login');
    } catch (err) {
      message.error(err.response?.data?.message || t('register_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{t('register')}</h1>
        <Form
          name="register"
          onFinish={onFinish}
          scrollToFirstError
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: t('name_required') }]}
          >
            <Input prefix={<UserOutlined />} placeholder={t('full_name')} />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('email_required') },
              { type: 'email', message: t('invalid_email') }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder={t('email')} />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('password_required') }]}
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('password')} />
          </Form.Item>

          <Form.Item
            name="confirm"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: t('confirm_password_required') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('password_mismatch')));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('confirm_password')} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t('register')}
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-links">
          <Link to="/login">{t('already_have_account')}</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
```

## 2. Chat Pages

### client/src/pages/Chat/ChatListPage.jsx
```javascript
import { useState, useEffect } from 'react';
import { List, Input, Badge, Avatar } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const ChatListPage = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await api.get('/chat/rooms');
        setChats(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="chat-list-page">
      <div className="chat-list-header">
        <h1>{t('chats')}</h1>
        <Input
          placeholder={t('search_chats')}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>

      <List
        loading={loading}
        dataSource={filteredChats}
        renderItem={(chat) => (
          <List.Item
            className="chat-item"
            onClick={() => navigate(`/chat/${chat._id}`)}
          >
            <List.Item.Meta
              avatar={
                <Badge count={chat.unreadCount} offset={[-5, 5]}>
                  <Avatar src={chat.isGroup ? chat.avatar : chat.participants[0]?.profilePicture} />
                </Badge>
              }
              title={chat.name}
              description={chat.lastMessage?.text || t('no_messages')}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default ChatListPage;
```

### client/src/pages/Chat/ChatRoomPage.jsx
```javascript
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Input, Button, Avatar, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import api from '../../services/api';
import socket from '../../services/socketService';
import MessageList from '../../components/chat/MessageList';
import TypingIndicator from '../../components/chat/TypingIndicator';
import { useTranslation } from 'react-i18next';

const ChatRoomPage = () => {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/chat/rooms/${roomId}/messages`);
        setMessages(response.data);
        scrollToBottom();
      } catch (err) {
        message.error(t('load_messages_failed'));
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Socket.io setup
    socket.emit('joinRoom', roomId);
    socket.on('newMessage', handleNewMessage);
    socket.on('userTyping', handleUserTyping);

    return () => {
      socket.emit('leaveRoom', roomId);
      socket.off('newMessage', handleNewMessage);
      socket.off('userTyping', handleUserTyping);
    };
  }, [roomId]);

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
    scrollToBottom();
  };

  const handleUserTyping = ({ userId, isTyping, userName }) => {
    setIsTyping(isTyping);
    setTypingUser(isTyping ? userName : null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const message = {
        roomId,
        text: newMessage
      };

      const response = await api.post('/chat/messages', message);
      socket.emit('sendMessage', response.data);
      setNewMessage('');
    } catch (err) {
      message.error(t('send_message_failed'));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      socket.emit('typing', { roomId, isTyping: true });
      setTimeout(() => {
        socket.emit('typing', { roomId, isTyping: false });
      }, 2000);
    }
  };

  return (
    <div className="chat-room-page">
      <div className="chat-messages">
        {loading ? (
          <div className="loading-messages">{t('loading')}...</div>
        ) : (
          <>
            <MessageList messages={messages} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="chat-input-area">
        <TypingIndicator isTyping={isTyping} userName={typingUser} />
        <div className="message-input-container">
          <Input.TextArea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('type_message')}
            autoSize={{ minRows: 1, maxRows: 4 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={sendMessage}
            disabled={!newMessage.trim()}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatRoomPage;
```

## 3. Friends Pages

### client/src/pages/Friends/FriendListPage.jsx
```javascript
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
```

### client/src/pages/Friends/FriendRequestsPage.jsx
```javascript
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
```

## 4. Profile Pages

### client/src/pages/Profile/UserProfilePage.jsx
```javascript
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
```

### client/src/pages/Profile/EditProfilePage.jsx
```javascript
import { useState, useEffect } from 'react';
import { Form, Input, Button, Upload, message } from 'antd';
import { UserOutlined, MailOutlined, EditOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const EditProfilePage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/me');
        form.setFieldsValue(response.data);
        if (response.data.profilePicture) {
          setFileList([{
            uid: '-1',
            name: 'profile.jpg',
            status: 'done',
            url: response.data.profilePicture
          }]);
        }
      } catch (err) {
        message.error(t('profile_load_failed'));
      }
    };

    fetchProfile();
  }, []);

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error(t('upload_jpg_png_only'));
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error(t('image_too_large'));
    }
    return isJpgOrPng && isLt2M;
  };

  const handleUploadChange = ({ fileList }) => setFileList(file
### လိုအပ်နိုင်သော အဆုံးသတ်အလုပ်များ

1. **Testing Setup**
   - Jest configuration များ
   - Mock services များ
   - End-to-end test cases

2. **CI/CD Pipeline**
   - GitHub Actions workflow file
   - Deployment scripts

3. **Performance Optimization**
   - Database indexing
   - Query optimization
   - Caching strategies

4. **Security Hardening**
   - CSP headers
   - Rate limiting rules
   - Input sanitization

5. **Monitoring**
   - Health check endpoints
   - Performance metrics
   - Error tracking

ဤအပိုင်းများသည် သင့်အား project ကို production-ready အဆင့်သို့ ရောက်ရှိစေရန် ကူညီပေးပါလိမ့်မည်။ နောက်ဆုံးအဆင့်အနေဖြင့် အောက်ပါတို့ကို စစ်ဆေးပါ:

1. အားလုံးသော environment variables များ စနစ်တကျ configure လုပ်ပါ
2. Docker နှင့် deployment scripts များ test လုပ်ပါ
3. API documentation ပြည့်စုံစွာ ရေးသားပါ
4. Error handling နှင့် logging စနစ် ပြည့်စုံပါစေ
5. Performance testing ပြုလုပ်ပါ

လိုအပ်ပါက နောက်ထပ် အသေးစိတ်ရှင်းလင်းချက်များအတွက် ဆက်လက်မေးမြန်းနိုင်ပါသည်။
