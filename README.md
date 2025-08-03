ကျေးဇူးပြု၍ Burme Chat Project အတွက် ကျန်ရှိနေသေးသော အရေးကြီးသည့် code အပိုင်းများကို အောက်ပါအတိုင်း ဖြည့်စွက်ပါမည်။

## 1. Server Utilities (server/utils/)

### validation.js
```javascript
const Joi = require('joi');
const { phone } = require('phone');

exports.validateRegisterInput = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    phoneNumber: Joi.string().custom((value, helpers) => {
      const result = phone(value);
      if (!result.isValid) {
        return helpers.error('any.invalid');
      }
      return value;
    }).optional()
  });

  return schema.validate(data);
};

exports.validateLoginInput = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  return schema.validate(data);
};
```

### socketAuth.js
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error('Authentication error'));
    }

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
};
```

## 2. Client Hooks (client/src/hooks/)

### useNearbyUsers.js
```javascript
import { useState, useEffect } from 'react';
import { getCurrentLocation } from '../utils/gpsUtils';
import api from '../services/api';

const useNearbyUsers = (radius = 5) => {
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNearbyUsers = async () => {
      try {
        const { latitude, longitude } = await getCurrentLocation();
        const response = await api.get(
          `/users/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`
        );
        setNearbyUsers(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyUsers();
  }, [radius]);

  return { nearbyUsers, loading, error };
};

export default useNearbyUsers;
```

### useUnreadCount.js
```javascript
import { useState, useEffect } from 'react';
import socket from '../services/socketService';
import api from '../services/api';

const useUnreadCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await api.get('/chat/unread-count');
        setUnreadCount(response.data.count);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    fetchUnreadCount();

    socket.on('newMessage', () => {
      setUnreadCount(prev => prev + 1);
    });

    socket.on('markAsRead', ({ roomId }) => {
      setUnreadCount(prev => prev - 1);
    });

    return () => {
      socket.off('newMessage');
      socket.off('markAsRead');
    };
  }, []);

  return unreadCount;
};

export default useUnreadCount;
```

## 3. UI Components (client/src/components/ui/)

### LoadingSpinner.jsx
```javascript
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const LoadingSpinner = ({ size = 24 }) => {
  return (
    <div className="loading-spinner">
      <Spin indicator={<LoadingOutlined style={{ fontSize: size }} spin />} />
    </div>
  );
};

export default LoadingSpinner;
```

### ResponsiveDrawer.jsx
```javascript
import { useState, useEffect } from 'react';
import { Drawer, Button } from 'antd';
import { MenuOutlined } from '@ant-design/icons';

const ResponsiveDrawer = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <>
      {isMobile && (
        <Button 
          type="text" 
          icon={<MenuOutlined />} 
          onClick={() => setVisible(true)}
          className="drawer-button"
        />
      )}

      {isMobile ? (
        <Drawer
          placement="left"
          onClose={() => setVisible(false)}
          visible={visible}
          width={250}
        >
          {children}
        </Drawer>
      ) : (
        <div className="sidebar">
          {children}
        </div>
      )}
    </>
  );
};

export default ResponsiveDrawer;
```

## 4. Server Models (server/models/)

### Report.js
```javascript
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedChat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom'
  },
  reason: {
    type: String,
    required: true,
    enum: ['spam', 'harassment', 'inappropriate', 'other']
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  },
  actionTaken: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
```

### DeviceToken.js
```javascript
const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  platform: {
    type: String,
    enum: ['android', 'ios', 'web'],
    required: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
```

## 5. Server Services (server/services/)

### locationService.js
```javascript
const User = require('../models/User');
const { calculateDistance } = require('../utils/geoUtils');

exports.updateUserLocation = async (userId, coordinates) => {
  await User.findByIdAndUpdate(userId, {
    location: {
      type: 'Point',
      coordinates
    },
    lastActive: new Date()
  });
};

exports.findNearbyUsers = async (latitude, longitude, radius, excludeUserId) => {
  const users = await User.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude]
        },
        $maxDistance: radius * 1000
      }
    },
    _id: { $ne: excludeUserId }
  }).select('name profilePicture location');

  return users.map(user => ({
    ...user.toObject(),
    distance: calculateDistance(
      latitude,
      longitude,
      user.location.coordinates[1],
      user.location.coordinates[0]
    )
  }));
};
```

### notificationService.js
```javascript
const Notification = require('../models/Notification');
const pushNotification = require('./pushNotification');
const socketService = require('./socketService');

exports.createNotification = async (userId, type, content, relatedData = {}) => {
  const notification = await Notification.create({
    user: userId,
    type,
    content,
    ...relatedData
  });

  // Send real-time notification via socket
  const io = socketService.getIO();
  io.to(userId.toString()).emit('newNotification', notification);

  // Send push notification
  await pushNotification.send(userId, {
    title: getNotificationTitle(type),
    body: content
  });

  return notification;
};

function getNotificationTitle(type) {
  const titles = {
    message: 'New Message',
    friendRequest: 'Friend Request',
    friendAccept: 'Friend Request Accepted'
  };
  return titles[type] || 'New Notification';
}
```

## 6. Client Utils (client/src/utils/)

### chatUtils.js
```javascript
export const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } else {
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  }
};

export const groupMessagesByDate = (messages) => {
  const grouped = {};
  
  messages.forEach(message => {
    const date = new Date(message.createdAt).toDateString();
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(message);
  });

  return grouped;
};
```

### fileUtils.js
```javascript
export const validateFile = (file, allowedTypes, maxSizeMB) => {
  const fileType = file.type.split('/')[0];
  const isValidType = allowedTypes.includes(fileType);
  const isValidSize = file.size <= maxSizeMB * 1024 * 1024;

  return {
    isValid: isValidType && isValidSize,
    errors: [
      !isValidType && `File type must be: ${allowedTypes.join(', ')}`,
      !isValidSize && `File size must be under ${maxSizeMB}MB`
    ].filter(Boolean)
  };
};

export const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
```

## 7. Server Controllers (server/controllers/)

### adminController.js
```javascript
const User = require('../models/User');
const Report = require('../models/Report');

exports.banUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isBanned: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update related reports
    await Report.updateMany(
      { reportedUser: user._id, status: 'pending' },
      { status: 'resolved', actionTaken: 'User banned' }
    );

    res.json({ message: 'User banned successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getPlatformStats = async (req, res) => {
  try {
    const [userCount, activeUserCount, bannedUserCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastActive: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }),
      User.countDocuments({ isBanned: true })
    ]);

    res.json({
      userCount,
      activeUserCount,
      bannedUserCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
```

### deviceController.js
```javascript
const DeviceToken = require('../models/DeviceToken');

exports.registerDevice = async (req, res) => {
  try {
    const { token, platform } = req.body;

    // Check if token already exists
    const existingToken = await DeviceToken.findOne({ token });
    if (existingToken) {
      return res.json({ message: 'Device already registered' });
    }

    // Create new device token
    await DeviceToken.create({
      user: req.user._id,
      token,
      platform
    });

    res.json({ message: 'Device registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.unregisterDevice = async (req, res) => {
  try {
    await DeviceToken.findOneAndDelete({
      user: req.user._id,
      token: req.body.token
    });

    res.json({ message: 'Device unregistered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
```

## 8. Client Contexts (client/src/contexts/)

### ChatContext.jsx
```javascript
import { createContext, useState, useEffect } from 'react';
import socket from '../services/socketService';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [activeRooms, setActiveRooms] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    socket.on('roomListUpdate', (rooms) => {
      setActiveRooms(rooms);
    });

    socket.on('unreadCountUpdate', ({ roomId, count }) => {
      setUnreadCounts(prev => ({ ...prev, [roomId]: count }));
    });

    socket.on('userTyping', ({ roomId, userId, isTyping }) => {
      setTypingUsers(prev => {
        const roomTyping = prev[roomId] || [];
        return {
          ...prev,
          [roomId]: isTyping 
            ? [...roomTyping.filter(id => id !== userId), userId]
            : roomTyping.filter(id => id !== userId)
        };
      });
    });

    return () => {
      socket.off('roomListUpdate');
      socket.off('unreadCountUpdate');
      socket.off('userTyping');
    };
  }, []);

  const value = {
    activeRooms,
    unreadCounts,
    typingUsers,
    joinRoom: (roomId) => socket.emit('joinRoom', roomId),
    leaveRoom: (roomId) => socket.emit('leaveRoom', roomId),
    markAsRead: (roomId) => socket.emit('markAsRead', roomId)
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
```

### UserContext.jsx
```javascript
import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/users/me');
        setCurrentUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const updateUser = (updates) => {
    setCurrentUser(prev => ({ ...prev, ...updates }));
  };

  const value = {
    currentUser,
    loading,
    updateUser,
    refetchUser: async () => {
      const response = await api.get('/users/me');
      setCurrentUser(response.data);
    }
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
```

## 9. Server Routes (server/routes/)

### analyticsRoutes.js
```javascript
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authController = require('../controllers/authController');

router.use(authController.protect, authController.restrictTo('admin'));

router.get('/stats', analyticsController.getPlatformStats);
router.get('/user-activity', analyticsController.getUserActivity);
router.get('/message-trends', analyticsController.getMessageTrends);

module.exports = router;
```

### uploadRoutes.js
```javascript
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authController = require('../controllers/authController');
const { uploadUserPhoto, resizeUserPhoto } = require('../services/fileUpload');

router.use(authController.protect);

router.post('/profile-photo', 
  uploadUserPhoto,
  resizeUserPhoto,
  uploadController.uploadProfilePhoto
);

router.post('/chat-media', 
  uploadController.uploadChatMedia
);

module.exports = router;
```

## 10. Client Services (client/src/services/)

### friendService.js
```javascript
import api from './api';

export const getFriends = async () => {
  const response = await api.get('/friends');
  return response.data;
};

export const getFriendRequests = async () => {
  const response = await api.get('/friends/requests');
  return response.data;
};

export const sendFriendRequest = async (userId) => {
  const response = await api.post(`/friends/${userId}`);
  return response.data;
};

export const respondToRequest = async (requestId, accept) => {
  const response = await api.patch(`/friends/requests/${requestId}`, {
    action: accept ? 'accept' : 'reject'
  });
  return response.data;
};

export const removeFriend = async (userId) => {
  const response = await api.delete(`/friends/${userId}`);
  return response.data;
};
```

### locationService.js
```javascript
import api from './api';

export const updateLocation = async (latitude, longitude) => {
  const response = await api.patch('/users/location', {
    latitude,
    longitude
  });
  return response.data;
};

export const getNearbyUsers = async (latitude, longitude, radius) => {
  const response = await api.get(
    `/users/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`
  );
  return response.data;
};
```
