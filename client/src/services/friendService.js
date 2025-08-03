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
