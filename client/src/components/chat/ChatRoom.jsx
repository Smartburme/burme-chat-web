import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import socket from '../../services/socketService';

const ChatRoom = ({ roomId, currentUser }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Join the room
    socket.emit('joinRoom', { roomId, userId: currentUser._id });

    // Load previous messages
    const loadMessages = async () => {
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`);
      const data = await response.json();
      setMessages(data.messages);
    };
    loadMessages();

    // Listen for new messages
    socket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.emit('leaveRoom', { roomId, userId: currentUser._id });
      socket.off('newMessage');
    };
  }, [roomId, currentUser._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      roomId,
      sender: currentUser._id,
      text: newMessage,
      timestamp: new Date().toISOString()
    };

    socket.emit('sendMessage', message);
    setNewMessage('');
  };

  return (
    <div className="chat-room">
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.sender === currentUser._id ? 'sent' : 'received'}`}
          >
            <p className="message-text">{msg.text}</p>
            <span className="message-time">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={t('type_message')}
        />
        <button type="submit">{t('send')}</button>
      </form>
    </div>
  );
};

export default ChatRoom;
