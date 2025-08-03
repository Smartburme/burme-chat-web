ကျေးဇူးပြု၍ Burme Chat Project အတွက် ကျန်ရှိသော အရေးကြီးသည့် အပိုင်းများကို ဆက်လက်ရေးသားပေးပါမည်။

## 1. Video Call Component (WebRTC)

### client/src/components/call/VideoCallModal.jsx
```javascript
import { useState, useEffect, useRef } from 'react';
import { Modal, Button, message } from 'antd';
import { PhoneOutlined, CloseOutlined } from '@ant-design/icons';
import socket from '../../services/socketService';
import { useTranslation } from 'react-i18next';

const VideoCallModal = ({ callId, onEndCall }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('connecting');
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const pcRef = useRef();
  const { t } = useTranslation();

  useEffect(() => {
    const setupCall = async () => {
      try {
        // 1. Get local media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        localVideoRef.current.srcObject = stream;

        // 2. Create peer connection
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });
        pcRef.current = pc;

        // 3. Add local stream to connection
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // 4. Handle remote stream
        pc.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          remoteVideoRef.current.srcObject = event.streams[0];
          setCallStatus('active');
        };

        // 5. Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('call-signal', {
              callId,
              type: 'candidate',
              data: event.candidate
            });
          }
        };

        // 6. Listen for signals
        socket.on('call-signal', handleSignal);

      } catch (err) {
        message.error(t('call_setup_failed'));
        onEndCall();
      }
    };

    if (callId) setupCall();

    return () => {
      if (pcRef.current) pcRef.current.close();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      socket.off('call-signal', handleSignal);
    };
  }, [callId]);

  const handleSignal = async ({ type, data }) => {
    const pc = pcRef.current;
    try {
      if (type === 'offer') {
        await pc.setRemoteDescription(data);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('call-signal', {
          callId,
          type: 'answer',
          data: answer
        });
      } 
      else if (type === 'answer') {
        await pc.setRemoteDescription(data);
      } 
      else if (type === 'candidate') {
        await pc.addIceCandidate(data);
      }
    } catch (err) {
      console.error('Signal handling error:', err);
    }
  };

  const endCall = () => {
    socket.emit('end-call', { callId });
    onEndCall();
  };

  return (
    <Modal
      visible={!!callId}
      footer={null}
      closable={false}
      width={800}
      centered
      className="video-call-modal"
    >
      <div className="video-container">
        <div className="remote-video">
          <video ref={remoteVideoRef} autoPlay playsInline />
          {callStatus === 'connecting' && (
            <div className="call-status">{t('waiting_for_answer')}</div>
          )}
        </div>
        
        <div className="local-video">
          <video ref={localVideoRef} autoPlay playsInline muted />
        </div>

        <div className="call-controls">
          <Button 
            type="primary" 
            danger 
            icon={<CloseOutlined />}
            onClick={endCall}
            size="large"
            className="end-call-btn"
          />
        </div>
      </div>
    </Modal>
  );
};

export default VideoCallModal;
```

## 2. Server-side WebRTC Signaling

### server/services/callService.js
```javascript
const Call = require('../models/Call');
const socketService = require('./socketService');

const activeCalls = new Map();

exports.initCallHandling = () => {
  const io = socketService.getIO();

  io.on('connection', (socket) => {
    socket.on('start-call', async ({ callerId, receiverId }) => {
      const call = new Call({ caller: callerId, receiver: receiverId });
      await call.save();
      
      activeCalls.set(call._id.toString(), {
        callerSocket: socket.id,
        receiverSocket: null
      });

      socket.to(receiverId).emit('incoming-call', {
        callId: call._id,
        callerId
      });
    });

    socket.on('accept-call', ({ callId }) => {
      const call = activeCalls.get(callId);
      if (call) {
        call.receiverSocket = socket.id;
        socket.to(call.callerSocket).emit('call-accepted', { callId });
      }
    });

    socket.on('call-signal', ({ callId, ...signal }) => {
      const call = activeCalls.get(callId);
      if (!call) return;

      const targetSocket = socket.id === call.callerSocket 
        ? call.receiverSocket 
        : call.callerSocket;
      
      if (targetSocket) {
        socket.to(targetSocket).emit('call-signal', signal);
      }
    });

    socket.on('end-call', async ({ callId }) => {
      const call = activeCalls.get(callId);
      if (!call) return;

      if (call.receiverSocket) {
        socket.to(call.receiverSocket).emit('call-ended');
      }
      if (call.callerSocket && call.callerSocket !== socket.id) {
        socket.to(call.callerSocket).emit('call-ended');
      }

      await Call.findByIdAndUpdate(callId, { endedAt: new Date() });
      activeCalls.delete(callId);
    });
  });
};
```

## 3. Message Reactions

### client/src/components/chat/MessageReactions.jsx
```javascript
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
```

## 4. Admin Dashboard Components

### client/src/pages/admin/UserManagement.jsx
```javascript
import { useState, useEffect, useMemo } from 'react';
import { Table, Tag, Button, Input, Select, message } from 'antd';
import { SearchOutlined, EditOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({});
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const params = {
          page: pagination.current,
          limit: pagination.pageSize,
          ...filters
        };
        const response = await api.get('/admin/users', { params });
        setUsers(response.data.users);
        setPagination(prev => ({
          ...prev,
          total: response.data.total
        }));
      } catch (err) {
        message.error(t('user_fetch_failed'));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [pagination.current, pagination.pageSize, filters]);

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStatusChange = async (userId, isBanned) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { isBanned });
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, isBanned } : user
      ));
      message.success(t('user_updated'));
    } catch (err) {
      message.error(t('update_failed'));
    }
  };

  const columns = [
    {
      title: t('name'),
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="user-cell">
          <img src={record.profilePicture} alt={text} className="user-avatar" />
          <span>{text}</span>
        </div>
      )
    },
    {
      title: t('email'),
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: t('status'),
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isBanned ? 'red' : 'green'}>
          {record.isBanned ? t('banned') : t('active')}
        </Tag>
      )
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (_, record) => (
        <Button
          type={record.isBanned ? 'primary' : 'danger'}
          onClick={() => handleStatusChange(record._id, !record.isBanned)}
        >
          {record.isBanned ? t('unban') : t('ban')}
        </Button>
      )
    }
  ];

  return (
    <div className="user-management">
      <div className="toolbar">
        <Input
          placeholder={t('search_users')}
          prefix={<SearchOutlined />}
          allowClear
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 300 }}
        />
        
        <Select
          placeholder={t('filter_status')}
          allowClear
          onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          style={{ width: 150 }}
          options={[
            { value: 'active', label: t('active') },
            { value: 'banned', label: t('banned') }
          ]}
        />
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="_id"
        loading={loading}
        pagination={pagination}
        onChange={(newPagination) => setPagination(newPagination)}
      />
    </div>
  );
};

export default UserManagement;
```

## 5. Automated Testing Setup

### client/src/tests/setupTests.js
```javascript
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

// Mock global objects
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Configure test behavior
configure({
  testIdAttribute: 'data-testid',
});

// Mock socket.io
jest.mock('../services/socketService', () => ({
  on: jest.fn(),
  emit: jest.fn(),
  off: jest.fn(),
}));

// Mock API calls
jest.mock('../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
}));
```

### server/tests/auth.test.js
```javascript
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const { connectDB, disconnectDB } = require('../config/database');

describe('Auth Controller', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany();
  });

  describe('POST /register', () => {
    it('should register a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('test@example.com');
    });

    it('should return 400 with invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
          confirmPassword: 'password123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('fail');
    });
  });

  describe('POST /login', () => {
    it('should login with valid credentials', async () => {
      // First register a user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        });

      // Then test login
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });
  });
});
```

## 6. Docker Configuration

### Dockerfile (Backend)
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production
ENV PORT=5000

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

### Dockerfile (Frontend)
```dockerfile
FROM node:16-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.prod.yml
```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/burmechat
      - JWT_SECRET=your_jwt_secret_prod
      - REDIS_HOST=redis
    depends_on:
      - mongo
      - redis

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend

  mongo:
    image: mongo:5.0
    volumes:
      - mongo-data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=example

  redis:
    image: redis:6.2-alpine
    volumes:
      - redis-data:/data

volumes:
  mongo-data:
  redis-data:
```
