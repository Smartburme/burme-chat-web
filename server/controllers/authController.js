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
