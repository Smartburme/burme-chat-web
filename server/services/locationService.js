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
