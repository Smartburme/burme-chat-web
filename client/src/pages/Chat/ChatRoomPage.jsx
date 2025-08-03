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
