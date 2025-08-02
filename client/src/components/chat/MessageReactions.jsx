import { useState } from 'react';
import { Popover, Button, Space, Badge } from 'antd';
import { SmileOutlined } from '@ant-design/icons';
import api from '../../services/api';

const reactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const MessageReactions = ({ messageId, initialReactions }) => {
  const [reactionsData, setReactionsData] = useState(initialReactions || {});
  const [loading, setLoading] = useState(false);

  const handleReaction = async (emoji) => {
    try {
      setLoading(true);
      const response = await api.post(`/messages/${messageId}/react`, { emoji });
      setReactionsData(response.data.reactions);
    } catch (err) {
      console.error('Failed to add reaction:', err);
    } finally {
      setLoading(false);
    }
  };

  const reactionContent = (
    <Space size="small">
      {reactions.map(emoji => (
        <Button 
          key={emoji} 
          type="text" 
          onClick={() => handleReaction(emoji)}
          disabled={loading}
        >
          {emoji}
        </Button>
      ))}
    </Space>
  );

  const totalReactions = Object.values(reactionsData).reduce((sum, count) => sum + count, 0);

  return (
    <Popover content={reactionContent} trigger="click">
      <Badge count={totalReactions}>
        <Button 
          type="text" 
          icon={<SmileOutlined />} 
          size="small"
        />
      </Badge>
    </Popover>
  );
};

export default MessageReactions;
