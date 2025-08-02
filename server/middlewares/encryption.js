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
