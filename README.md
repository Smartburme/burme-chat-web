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

## 9. Chat Controller (server/controllers/chatController.js)

```javascript
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const AppError = require('../utils/appError');

exports.createChatRoom = async (req, res, next) => {
  try {
    const { participants, isGroup, name } = req.body;
    
    // Private chat validation
    if (!isGroup && participants.length !== 2) {
      return next(new AppError('Private chat requires exactly 2 participants', 400));
    }

    const newRoom = await ChatRoom.create({
      participants,
      isGroup,
      name: isGroup ? name : null,
      createdBy: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: {
        room: newRoom
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { limit = 20, page = 1 } = req.query;

    // Check if user is participant
    const room = await ChatRoom.findOne({
      _id: roomId,
      participants: req.user.id
    });

    if (!room) {
      return next(new AppError('You are not authorized to view this chat', 403));
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({ room: roomId })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name profilePicture');

    res.status(200).json({
      status: 'success',
      results: messages.length,
      data: {
        messages
      }
    });
  } catch (err) {
    next(err);
  }
};
```

## 10. Notification System (server/models/Notification.js)

```javascript
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  },
  type: {
    type: String,
    enum: ['friendRequest', 'message', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedChat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
```

## 11. Real-time Notification Component (client/src/components/notifications/NotificationBell.jsx)

```javascript
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Popover, List, Avatar } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import api from '../../services/api';

const NotificationBell = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    setupSocketListeners();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    const socket = io();
    socket.on('newNotification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? {...n, isRead: true} : n)
      );
      setUnreadCount(prev => prev - 1);
    } catch (err) {
      console.error(err);
    }
  };

  const content = (
    <List
      loading={loading}
      dataSource={notifications}
      renderItem={item => (
        <List.Item 
          onClick={() => markAsRead(item._id)}
          style={{ cursor: 'pointer' }}
        >
          <List.Item.Meta
            avatar={<Avatar src={item.relatedUser?.profilePicture} />}
            title={item.content}
            description={new Date(item.createdAt).toLocaleString()}
          />
          {!item.isRead && <div className="unread-dot"></div>}
        </List.Item>
      )}
    />
  );

  return (
    <Popover content={content} title={t('notifications')} trigger="click">
      <Badge count={unreadCount}>
        <BellOutlined style={{ fontSize: '20px', cursor: 'pointer' }} />
      </Badge>
    </Popover>
  );
};

export default NotificationBell;
```

## 12. File Upload Service (server/services/fileUpload.js)

```javascript
const multer = require('multer');
const sharp = require('sharp');
const AppError = require('../utils/appError');
const { v4: uuidv4 } = require('uuid');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const filename = `user-${req.user.id}-${uuidv4()}.jpeg`;

    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${filename}`);

    req.body.profilePicture = filename;
    next();
  } catch (err) {
    next(err);
  }
};
```

## 13. Error Handling Middleware (server/middlewares/errorMiddleware.js)

```javascript
const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);

    sendErrorProd(error, res);
  }
};
```

## 14. API Documentation (server/utils/apiDocs.js)

```javascript
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Burme Chat API',
      version: '1.0.0',
      description: 'API documentation for Burme Chat application',
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
```

## 15. Frontend API Service (client/src/services/api.js)

```javascript
import axios from 'axios';
import { getToken } from './authService';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```
