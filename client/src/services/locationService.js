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
