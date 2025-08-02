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
