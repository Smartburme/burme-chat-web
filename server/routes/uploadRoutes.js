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
