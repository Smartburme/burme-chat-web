## Burme Chat

# Project structure 
```
burme-chat/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   ├── friends/
│   │   │   ├── profile/
│   │   │   └── ui/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   ├── Auth/
│   │   │   ├── Chat/
│   │   │   ├── Friends/
│   │   │   ├── Profile/
│   │   │   └── Settings/
│   │   ├── services/
│   │   ├── store/
│   │   ├── translations/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   └── package.json
├── .gitignore
└── README.md
```

ဆက်လက်၍ ကျန်ရှိနေသော အရေးကြီးသည့် အပိုင်းများကို ဖြည့်စွက်ရေးသားပေးပါမည်။

## 16. Admin Dashboard Components (client/src/components/admin/)

### AdminPanel.jsx
```javascript
import { useState, useEffect } from 'react';
import { Tabs, Table, Tag, Button, message } from 'antd';
import api from '../../services/api';

const { TabPane } = Tabs;

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, reportsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/reports')
      ]);
      setUsers(usersRes.data);
      setReports(reportsRes.data);
    } catch (err) {
      message.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/ban`);
      message.success('User banned successfully');
      fetchData();
    } catch (err) {
      message.error('Failed to ban user');
    }
  };

  const userColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isBanned ? 'red' : 'green'}>
          {record.isBanned ? 'Banned' : 'Active'}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          danger 
          onClick={() => handleBanUser(record._id)}
          disabled={record.isBanned}
        >
          Ban
        </Button>
      )
    }
  ];

  const reportColumns = [
    {
      title: 'Reported User',
      dataIndex: ['reportedUser', 'name'],
      key: 'reportedUser'
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status'
    }
  ];

  return (
    <div className="admin-panel">
      <Tabs defaultActiveKey="1">
        <TabPane tab="User Management" key="1">
          <Table 
            columns={userColumns} 
            dataSource={users} 
            loading={loading}
            rowKey="_id"
          />
        </TabPane>
        <TabPane tab="Report Management" key="2">
          <Table 
            columns={reportColumns} 
            dataSource={reports} 
            loading={loading}
            rowKey="_id"
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
```

## 17. User Blocking System (server/models/Block.js)

```javascript
const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  blocker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blocked: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate blocks
blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

module.exports = mongoose.model('Block', blockSchema);
```

## 18. Message Encryption Middleware (server/middlewares/encryption.js)

```javascript
const crypto = require('crypto');
const AppError = require('../utils/appError');

const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
const iv = Buffer.alloc(16, 0);

exports.encryptMessage = (text) => {
  try {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (err) {
    throw new AppError('Message encryption failed', 500);
  }
};

exports.decryptMessage = (encryptedText) => {
  try {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    throw new AppError('Message decryption failed', 500);
  }
};
```

## 19. Message Queue for Notifications (server/services/queueService.js)

```javascript
const Queue = require('bull');
const Notification = require('../models/Notification');
const socketService = require('./socketService');

const notificationQueue = new Queue('notifications', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

notificationQueue.process(async (job) => {
  const { userId, type, content, relatedUser, relatedChat } = job.data;
  
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      content,
      relatedUser,
      relatedChat
    });

    // Emit real-time notification
    const io = socketService.getIO();
    io.to(userId.toString()).emit('newNotification', notification);

    return notification;
  } catch (err) {
    console.error('Notification processing failed:', err);
    throw err;
  }
});

module.exports = notificationQueue;
```

## 20. User Status Tracker (server/services/userStatus.js)

```javascript
const User = require('../models/User');
const socketService = require('./socketService');

const onlineUsers = new Map();

const updateUserStatus = async (userId, isOnline) => {
  try {
    // Update in database
    await User.findByIdAndUpdate(userId, {
      lastActive: new Date(),
      isOnline
    });

    // Update in memory map
    if (isOnline) {
      onlineUsers.set(userId.toString(), true);
    } else {
      onlineUsers.delete(userId.toString());
    }

    // Broadcast status change to friends
    const user = await User.findById(userId).select('friends');
    const io = socketService.getIO();
    
    user.friends.forEach(friendId => {
      io.to(friendId.toString()).emit('friendStatusChange', {
        userId,
        isOnline
      });
    });
  } catch (err) {
    console.error('Status update failed:', err);
  }
};

const checkUserStatus = (userId) => {
  return onlineUsers.has(userId.toString());
};

module.exports = {
  updateUserStatus,
  checkUserStatus
};
```

## 21. Chat Message Reactions (client/src/components/chat/MessageReactions.jsx)

```javascript
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
```

## 22. Data Backup Script (server/scripts/backup.js)

```javascript
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const { exec } = require('child_process');
const { DB_NAME } = require('../../config');

const backupDir = path.join(__dirname, '../../backups');

const backupDatabase = async () => {
  try {
    // Create backup directory if not exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Clean up old backups (keep last 7)
    const files = await readdir(backupDir);
    if (files.length >= 7) {
      const oldestFile = files.sort()[0];
      await unlink(path.join(backupDir, oldestFile));
    }

    // Create new backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.gz`);

    await new Promise((resolve, reject) => {
      exec(`mongodump --db=${DB_NAME} --archive=${backupFile} --gzip`, 
        (error, stdout, stderr) => {
          if (error) {
            console.error('Backup failed:', stderr);
            return reject(error);
          }
          console.log('Backup successful:', stdout);
          resolve();
        }
      );
    });

    return backupFile;
  } catch (err) {
    console.error('Backup process failed:', err);
    throw err;
  }
};

module.exports = backupDatabase;
```

## 23. Rate Limiting Middleware (server/middlewares/rateLimit.js)

```javascript
const rateLimit = require('express-rate-limit');
const AppError = require('../utils/appError');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many login attempts from this IP, please try again later',
  handler: (req, res, next) => {
    next(new AppError('Too many requests from this IP', 429));
  }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // limit each IP to 1000 requests per hour
  message: 'Too many requests from this IP, please try again later'
});

const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

module.exports = {
  authLimiter,
  apiLimiter,
  strictLimiter
};
```

## 24. User Search Component (client/src/components/friends/UserSearch.jsx)

```javascript
import { useState, useEffect } from 'react';
import { Input, List, Avatar, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import api from '../../services/api';

const UserSearch = ({ onSelectUser }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/users/search?q=${query}`);
        setResults(response.data);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchUsers, 500);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="user-search">
      <Input
        placeholder="Search users..."
        prefix={<SearchOutlined />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        allowClear
      />

      {results.length > 0 ? (
        <List
          className="search-results"
          dataSource={results}
          loading={loading}
          renderItem={(user) => (
            <List.Item 
              onClick={() => onSelectUser(user)}
              style={{ cursor: 'pointer' }}
            >
              <List.Item.Meta
                avatar={<Avatar src={user.profilePicture} />}
                title={user.name}
                description={user.email}
              />
            </List.Item>
          )}
        />
      ) : query.trim().length >= 2 && !loading ? (
        <Empty description="No users found" />
      ) : null}
    </div>
  );
};

export default UserSearch;
```

## 25. Automated Testing (client/src/tests/)

### chatService.test.js
```javascript
import { sendMessage, getChatHistory } from '../services/chatService';
import api from '../services/api';

jest.mock('../services/api');

describe('Chat Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockResponse = { data: { success: true } };
      api.post.mockResolvedValue(mockResponse);

      const result = await sendMessage('room123', 'Hello world!');
      
      expect(api.post).toHaveBeenCalledWith('/chat/messages', {
        roomId: 'room123',
        text: 'Hello world!'
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle send message failure', async () => {
      const mockError = new Error('Network error');
      api.post.mockRejectedValue(mockError);

      await expect(sendMessage('room123', 'Hello'))
        .rejects
        .toThrow('Network error');
    });
  });

  describe('getChatHistory', () => {
    it('should fetch chat history', async () => {
      const mockMessages = [{ id: 1, text: 'Hi' }];
      api.get.mockResolvedValue({ data: { messages: mockMessages } });

      const result = await getChatHistory('room123');
      
      expect(api.get).toHaveBeenCalledWith('/chat/rooms/room123/messages');
      expect(result).toEqual(mockMessages);
    });
  });
});
```

ဤအပိုင်းများသည် သင့် Burme Chat application အတွက် အဆင့်မြင့် feature များနှင့် လုံခြုံရေး၊ စွမ်းဆောင်ရည်မြှင့်တင်မှုများကို ဖြည့်စွက်ပေးထားပါသည်။ လိုအပ်ပါက နောက်ထပ် အသေးစိတ်ရှင်းလင်းချက်များ သို့မဟုတ် အခြားသော feature များအတွက် ဆက်လက်မေးမြန်းနိုင်ပါသည်။
