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
