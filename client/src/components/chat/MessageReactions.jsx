import { useState } from 'react';
import { Popover, Badge, Tooltip } from 'antd';
import { SmileOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const reactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const MessageReactions = ({ messageId, initialReactions = {} }) => {
  const [reactionsData, setReactionsData] = useState(initialReactions);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

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

  const reactionList = Object.entries(reactionsData)
    .filter(([_, count]) => count > 0)
    .map(([emoji, count]) => (
      <Tooltip key={emoji} title={`${count} ${t('people')}`}>
        <span className="reaction-badge">{emoji} {count}</span>
      </Tooltip>
    ));

  return (
    <div className="message-reactions">
      {reactionList}
      
      <Popover
        content={(
          <div className="reaction-picker">
            {reactions.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                disabled={loading}
                className="reaction-option"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        trigger="click"
        placement="top"
      >
        <Badge dot={reactionList.length === 0}>
          <button className="add-reaction-btn">
            <SmileOutlined />
          </button>
        </Badge>
      </Popover>
    </div>
  );
};

export default MessageReactions;
