ကျေးဇူးပြု၍ project structure ထဲက ကျန်ရှိနေသော အရေးကြီးသည့် code အပိုင်းများကို ဆက်လက်ရေးသားပေးပါမည်။

## 1. API Routes (server/routes/)

### authRoutes.js
```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.protect, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

module.exports = router;
```

### userRoutes.js
```javascript
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

router.use(authController.protect);

router.get('/me', userController.getMe);
router.patch('/update-me', userController.updateMe);
router.patch('/update-password', authController.updatePassword);
router.get('/nearby', userController.getNearbyUsers);
router.post('/friends/:friendId', userController.addFriend);
router.delete('/friends/:friendId', userController.removeFriend);

module.exports = router;
```

## 2. Controller Files (server/controllers/)

### authController.js
```javascript
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const newUser = await User.create({
      name,
      email,
      password,
      location: {
        type: 'Point',
        coordinates: [req.body.longitude, req.body.latitude]
      }
    });

    const token = generateToken(newUser._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
}
```

## 3. Client-side Services (client/src/services/)

### authService.js
```javascript
import axios from 'axios';

const API_URL = '/api/v1/auth';

const register = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

const login = async (credentials) => {
  const response = await axios.post(`${API_URL}/login`, credentials);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

const logout = () => {
  localStorage.removeItem('token');
};

export default {
  register,
  login,
  logout
};
```

## 4. React Context (client/src/contexts/)

### AuthContext.jsx
```javascript
import { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get('/api/v1/users/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUser(response.data.data.user);
      } catch (err) {
        console.error(err);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const register = async (userData) => {
    const data = await authService.register(userData);
    setUser(data.user);
    return data;
  };

  const value = {
    user,
    isLoading,
    register,
    login: authService.login,
    logout: authService.logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
```

## 5. Utility Functions (client/src/utils/)

### gpsUtils.js
```javascript
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Haversine formula implementation
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
```

## 6. Redux Store (client/src/store/)

### authSlice.js
```javascript
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isLoading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.isLoading = false;
      state.user = action.payload;
    },
    loginFailure(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
```

## 7. Environment Configuration

### .env.example (root directory)
```env
# Server
PORT=5000
MONGODB_URI=mongodb://localhost:27017/burmechat
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=90d

# Client
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## 8. Testing Files (server/tests/)

### auth.test.js
```javascript
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Auth Controller', () => {
  beforeEach(async () => {
    await User.deleteMany();
  });

  describe('POST /register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          latitude: 16.8054,
          longitude: 96.1565
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
    });
  });
});
```

ဤ code အပိုင်းများသည် သင့် project တွင် လိုအပ်မည့် အခြေခံလုပ်ဆောင်ချက်များကို အတူတကွဖြည့်စွက်ပေးထားပါသည်။ လိုအပ်ပါက နောက်ထပ် feature များ သို့မဟုတ် အသေးစိတ်ရှင်းလင်းချက်များအတွက် ဆက်လက်မေးမြန်းနိုင်ပါသည်။          (err) => {
            setError(t('location_access_denied'));
            setLoading(false);
          }
        );
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchNearbyUsers();
  }, [radius, t]);

  return (
    <div className="nearby-friends">
      <h2>{t('nearby_friends')}</h2>
      <div className="radius-selector">
        <label>{t('search_radius')}: </label>
        <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
          <option value={1}>1 km</option>
          <option value={5}>5 km</option>
          <option value={10}>10 km</option>
          <option value={20}>20 km</option>
        </select>
      </div>
      
      {loading && <p>{t('loading')}...</p>}
      {error && <p className="error">{error}</p>}
      
      <div className="users-list">
        {nearbyUsers.map(user => (
          <div key={user._id} className="user-card">
            <img src={user.profilePicture} alt={user.name} />
            <h3>{user.name}</h3>
            <p>{user.distance.toFixed(1)} km away</p>
            <button>{t('add_friend')}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NearbyFriends;
```

### 3. Chat Room Implementation

`client/src/components/chat/ChatRoom.jsx`:
```javascript
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
```

### 4. Server-side API for Friend Finding

`server/controllers/friendController.js`:
```javascript
const User = require('../models/User');

exports.getNearbyUsers = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const users = await User.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      },
      _id: { $ne: req.user._id } // Exclude current user
    }).select('name profilePicture status');

    // Calculate distances
    const usersWithDistance = users.map(user => {
      const distance = calculateDistance(
        latitude, 
        longitude, 
        user.location.coordinates[1], 
        user.location.coordinates[0]
      );
      return { ...user._doc, distance };
    });

    res.json(usersWithDistance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

### 5. User Profile Component

`client/src/components/profile/UserProfile.jsx`:
```javascript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUserProfile } from '../../services/profileService';

const UserProfile = ({ currentUser }) => {
  const { t } = useTranslation();
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile(userId);
        setProfile(data);
        setIsFriend(data.friends.includes(currentUser._id));
        setIsCurrentUser(userId === currentUser._id);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, currentUser._id]);

  const handleFriendAction = async () => {
    try {
      if (isFriend) {
        // Remove friend logic
        await removeFriend(currentUser._id, userId);
      } else {
        // Add friend logic
        await addFriend(currentUser._id, userId);
      }
      setIsFriend(!isFriend);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>{t('loading')}...</p>;
  if (!profile) return <p>{t('profile_not_found')}</p>;

  return (
    <div className="user-profile">
      <div className="profile-header">
        <img 
          src={profile.profilePicture || '/default-profile.png'} 
          alt={profile.name} 
          className="profile-picture"
        />
        <h1>{profile.name}</h1>
        {!isCurrentUser && (
          <button onClick={handleFriendAction}>
            {isFriend ? t('remove_friend') : t('add_friend')}
          </button>
        )}
      </div>
      
      <div className="profile-details">
        <h2>{t('about')}</h2>
        <p>{profile.bio || t('no_bio')}</p>
        
        <h2>{t('interests')}</h2>
        <div className="interests">
          {profile.interests?.length > 0 ? (
            profile.interests.map(interest => (
              <span key={interest} className="interest-tag">{interest}</span>
            ))
          ) : (
            <p>{t('no_interests')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
```

### 6. Settings Page with Language Selection

`client/src/pages/Settings/SettingsPage.jsx`:
```javascript
import { useState } from 'react';
import { useTranslation, i18n } from 'react-i18next';

const SettingsPage = () => {
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    i18n.changeLanguage(newLanguage);
    setCurrentLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const handleNotificationToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // Save to user preferences in backend
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
    // Apply dark mode styles
  };

  return (
    <div className="settings-page">
      <h1>{t('settings')}</h1>
      
      <div className="setting-section">
        <h2>{t('language')}</h2>
        <select 
          value={currentLanguage} 
          onChange={handleLanguageChange}
          className="language-selector"
        >
          <option value="en">English</option>
          <option value="my">မြန်မာ (Burmese)</option>
          <option value="thi">ไทย (Thai)</option>
          <option value="vnd">Tiếng Việt (Vietnamese)</option>
        </select>
      </div>
      
      <div className="setting-section">
        <h2>{t('notifications')}</h2>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={notificationsEnabled}
            onChange={handleNotificationToggle}
          />
          <span className="slider round"></span>
        </label>
        <span className="setting-status">
          {notificationsEnabled ? t('enabled') : t('disabled')}
        </span>
      </div>
      
      <div className="setting-section">
        <h2>{t('dark_mode')}</h2>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={darkMode}
            onChange={handleDarkModeToggle}
          />
          <span className="slider round"></span>
        </label>
        <span className="setting-status">
          {darkMode ? t('enabled') : t('disabled')}
        </span>
      </div>
    </div>
  );
};

export default SettingsPage;
```

## Database Models

### User Model (server/models/User.js)
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: '' },
  bio: { type: String, default: '' },
  interests: [{ type: String }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  chatRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' }],
  language: { type: String, default: 'en' },
  settings: {
    notifications: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false }
  },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

### ChatRoom Model (server/models/ChatRoom.js)
```javascript
const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isGroup: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
}, { timestamps: true });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
```

### Message Model (server/models/Message.js)
```javascript
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  attachments: [{
    type: { type: String, enum: ['image', 'video', 'file'] },
    url: String,
    name: String,
    size: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
```

## Additional Recommendations

1. **Authentication**: Implement JWT-based authentication for secure API access
2. **Real-time Updates**: Use Socket.io for real-time chat and friend status updates
3. **Security**: Implement proper input validation and sanitization
4. **Performance**: Add pagination for messages and friend lists
5. **Testing**: Write unit and integration tests for critical components
6. **Deployment**: Use Docker for containerization and easy deployment

This structure provides a solid foundation for your Burme Chat application with all the requested features. You can expand on each component as needed for your specific requirements.
