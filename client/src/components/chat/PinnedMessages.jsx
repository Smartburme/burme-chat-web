import { useState, useEffect } from 'react';
import { List, Button, Popconfirm, message } from 'antd';
import { PushpinOutlined } from '@ant-design/icons';
import api from '../../services/api';

const PinnedMessages = ({ roomId }) => {
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPinnedMessages = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/chat/rooms/${roomId}/pinned-messages`);
        setPinnedMessages(response.data);
      } catch (err) {
        message.error('Failed to load pinned messages');
      } finally {
        setLoading(false);
      }
    };

    fetchPinnedMessages();
  }, [roomId]);

  const handleUnpin = async (messageId) => {
    try {
      await api.delete(`/chat/messages/${messageId}/pin`);
      setPinnedMessages(prev => prev.filter(msg => msg._id !== messageId));
      message.success('Message unpinned');
    } catch (err) {
      message.error('Failed to unpin message');
    }
  };

  return (
    <div className="pinned-messages">
      <h3>
        <PushpinOutlined /> Pinned Messages
      </h3>
      
      <List
        loading={loading}
        dataSource={pinnedMessages}
        renderItem={item => (
          <List.Item
            actions={[
              <Popconfirm
                title="Are you sure to unpin this message?"
                onConfirm={() => handleUnpin(item._id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="text" danger size="small">Unpin</Button>
              </Popconfirm>
            ]}
          >
            <List.Item.Meta
              description={
                <>
                  <div className="message-text">{item.text}</div>
                  <div className="message-meta">
                    {item.sender.name} • {new Date(item.createdAt).toLocaleString()}
                  </div>
                </>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default PinnedMessages;
