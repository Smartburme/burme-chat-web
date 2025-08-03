import { useState, useEffect } from 'react';
import { getCurrentLocation } from '../utils/gpsUtils';
import api from '../services/api';

const useNearbyUsers = (radius = 5) => {
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNearbyUsers = async () => {
      try {
        const { latitude, longitude } = await getCurrentLocation();
        const response = await api.get(
          `/users/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`
        );
        setNearbyUsers(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyUsers();
  }, [radius]);

  return { nearbyUsers, loading, error };
};

export default useNearbyUsers;
