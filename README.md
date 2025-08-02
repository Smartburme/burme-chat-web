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
ဆက်လက်၍ project structure ထဲက ကျန်ရှိနေသေးသော အရေးကြီးသည့် အပိုင်းများကို ဖြည့်စွက်ရေးသားပေးပါမည်။

## 26. Video Call Feature (WebRTC Implementation)

### client/src/components/call/VideoCall.jsx
```javascript
import { useState, useEffect, useRef } from 'react';
import { Button, Modal, message } from 'antd';
import { PhoneOutlined, CloseOutlined } from '@ant-design/icons';
import socket from '../../services/socketService';

const VideoCall = ({ callId, onEndCall }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef();

  useEffect(() => {
    if (!callId) return;

    const setupWebRTC = async () => {
      try {
        // Get local stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        localVideoRef.current.srcObject = stream;

        // Create peer connection
        peerConnection.current = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        // Add local stream to connection
        stream.getTracks().forEach(track => {
          peerConnection.current.addTrack(track, stream);
        });

        // Handle remote stream
        peerConnection.current.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsCallActive(true);
        };

        // Handle ICE candidates
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('call-signal', {
              callId,
              type: 'candidate',
              data: event.candidate
            });
          }
        };

        // Listen for signals
        socket.on('call-signal', handleSignal);

      } catch (err) {
        message.error('Failed to start call: ' + err.message);
        onEndCall();
      }
    };

    setupWebRTC();

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      socket.off('call-signal', handleSignal);
    };
  }, [callId]);

  const handleSignal = async ({ type, data }) => {
    try {
      if (type === 'offer') {
        await peerConnection.current.setRemoteDescription(data);
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        
        socket.emit('call-signal', {
          callId,
          type: 'answer',
          data: answer
        });
      } 
      else if (type === 'answer') {
        await peerConnection.current.setRemoteDescription(data);
      } 
      else if (type === 'candidate') {
        await peerConnection.current.addIceCandidate(data);
      }
    } catch (err) {
      console.error('Signal handling error:', err);
    }
  };

  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    onEndCall();
  };

  return (
    <Modal
      visible={!!callId}
      footer={null}
      closable={false}
      width={800}
      centered
    >
      <div className="video-call-container">
        <div className="remote-video">
          {remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline />
          ) : (
            <div className="waiting-message">Connecting...</div>
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
          />
        </div>
      </div>
    </Modal>
  );
};

export default VideoCall;
```

## 27. Push Notification Service (server/services/pushNotification.js)

```javascript
const webpush = require('web-push');
const User = require('../models/User');

// Configure VAPID keys
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.sendPushNotification = async (userId, payload) => {
  try {
    const user = await User.findById(userId).select('pushSubscriptions');
    
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return;
    }

    const notificationPromises = user.pushSubscriptions.map(subscription => {
      return webpush.sendNotification(
        JSON.parse(subscription),
        JSON.stringify(payload)
      ).catch(err => {
        if (err.statusCode === 410) {
          // Remove expired subscription
          user.pushSubscriptions = user.pushSubscriptions.filter(
            sub => sub !== subscription
          );
          return user.save();
        }
        console.error('Push notification failed:', err);
      });
    });

    await Promise.all(notificationPromises);
  } catch (err) {
    console.error('Push notification error:', err);
  }
};
```

## 28. Message Read Receipts (server/models/MessageRead.js)

```javascript
const mongoose = require('mongoose');

const messageReadSchema = new mongoose.Schema({
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  readAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one read record per message-user pair
messageReadSchema.index({ message: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('MessageRead', messageReadSchema);
```

## 29. Typing Indicators (client/src/components/chat/TypingIndicator.jsx)

```javascript
import { useEffect, useState } from 'react';
import { Badge } from 'antd';
import socket from '../../services/socketService';

const TypingIndicator = ({ roomId, currentUserId }) => {
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    const handleTyping = (data) => {
      if (data.roomId === roomId && data.userId !== currentUserId) {
        setTypingUsers(prev => {
          const exists = prev.some(u => u.userId === data.userId);
          return exists ? prev : [...prev, { userId: data.userId, name: data.name }];
        });

        // Remove user after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }, 3000);
      }
    };

    socket.on('user-typing', handleTyping);

    return () => {
      socket.off('user-typing', handleTyping);
    };
  }, [roomId, currentUserId]);

  if (typingUsers.length === 0) return null;

  return (
    <div className="typing-indicator">
      <Badge status="processing" />
      <span>
        {typingUsers.map(u => u.name).join(', ')} 
        {typingUsers.length === 1 ? ' is ' : ' are '}
        typing...
      </span>
    </div>
  );
};

export default TypingIndicator;
```

## 30. Data Analytics Dashboard (server/controllers/analyticsController.js)

```javascript
const User = require('../models/User');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');

exports.getPlatformStats = async (req, res) => {
  try {
    const [userCount, activeUserCount, messageCount, roomCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastActive: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }),
      Message.countDocuments(),
      ChatRoom.countDocuments()
    ]);

    const messagesByDay = await Message.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } },
      { $limit: 7 }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        userCount,
        activeUserCount,
        messageCount,
        roomCount,
        messagesByDay
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics data'
    });
  }
};
```

## 31. Scheduled Tasks (server/services/scheduler.js)

```javascript
const cron = require('node-cron');
const User = require('../models/User');
const backupDatabase = require('./backup');
const analyticsService = require('./analyticsService');

// Daily backup at 2 AM
cron.schedule('0 2 * * *', () => {
  console.log('Running daily database backup...');
  backupDatabase().catch(console.error);
});

// Weekly analytics report every Monday at 3 AM
cron.schedule('0 3 * * 1', () => {
  console.log('Generating weekly analytics report...');
  analyticsService.generateWeeklyReport().catch(console.error);
});

// Monthly inactive user cleanup on the 1st at 4 AM
cron.schedule('0 4 1 * *', async () => {
  console.log('Cleaning up inactive users...');
  try {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 6); // 6 months inactive
    
    const result = await User.deleteMany({
      lastActive: { $lt: cutoffDate },
      isAdmin: { $ne: true }
    });
    
    console.log(`Removed ${result.deletedCount} inactive users`);
  } catch (err) {
    console.error('Inactive user cleanup failed:', err);
  }
});
```

## 32. Content Moderation Middleware (server/middlewares/contentModeration.js)

```javascript
const axios = require('axios');
const AppError = require('../utils/appError');

exports.moderateContent = async (req, res, next) => {
  if (!req.body.text) return next();
  
  try {
    const response = await axios.post(process.env.MODERATION_API_URL, {
      text: req.body.text
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.MODERATION_API_KEY}`
      }
    });

    if (response.data.isToxic) {
      return next(new AppError('Your message contains inappropriate content', 400));
    }

    next();
  } catch (err) {
    console.error('Content moderation failed:', err);
    next(); // Allow to proceed if moderation service fails
  }
};
```

## 33. Chat Message Pinning (client/src/components/chat/PinnedMessages.jsx)

```javascript
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
```

## 34. User Presence Status (client/src/components/common/UserStatus.jsx)

```javascript
import { Badge, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import socket from '../../services/socketService';

const UserStatus = ({ userId, lastActive }) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Initial check
    const checkStatus = () => {
      const minutesSinceLastActive = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60);
      setIsOnline(minutesSinceLastActive < 5); // Consider online if active in last 5 minutes
    };

    checkStatus();

    // Listen for real-time updates
    socket.on('friendStatusChange', (data) => {
      if (data.userId === userId) {
        setIsOnline(data.isOnline);
      }
    });

    return () => {
      socket.off('friendStatusChange');
    };
  }, [userId, lastActive]);

  const getStatusTooltip = () => {
    if (isOnline) return 'Online now';
    return `Last seen ${new Date(lastActive).toLocaleString()}`;
  };

  return (
    <Tooltip title={getStatusTooltip()}>
      <Badge 
        status={isOnline ? 'success' : 'default'} 
        className="user-status-badge"
      />
    </Tooltip>
  );
};

export default UserStatus;
```

## 35. Chat Message Search (server/controllers/messageSearchController.js)

```javascript
const Message = require('../models/Message');
const escapeStringRegexp = require('escape-string-regexp');

exports.searchMessages = async (req, res) => {
  try {
    const { roomId, query } = req.query;
    
    if (!roomId || !query) {
      return res.status(400).json({
        status: 'fail',
        message: 'Room ID and search query are required'
      });
    }

    const searchRegex = new RegExp(escapeStringRegexp(query), 'i');
    
    const messages = await Message.find({
      room: roomId,
      text: searchRegex
    })
    .populate('sender', 'name profilePicture')
    .sort('-createdAt')
    .limit(50);

    res.status(200).json({
      status: 'success',
      results: messages.length,
      data: {
        messages
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to search messages'
    });
  }
};
```

ဤအပိုင်းများသည် သင့် Burme Chat application အတွက် အဆင့်မြင့် feature များနှင့် လိုအပ်သော utility များကို ဖြည့်စွက်ပေးထားပါသည်။ လိုအပ်ပါက နောက်ထပ် feature များ သို့မဟုတ် အသေးစိတ်ရှင်းလင်းချက်များအတွက် ဆက်လက်မေးမြန်းနိုင်ပါသည်။
