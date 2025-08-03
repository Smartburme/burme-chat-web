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
