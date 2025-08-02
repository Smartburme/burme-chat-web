import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getNearbyUsers } from '../../services/friendService';

const NearbyFriends = () => {
  const { t } = useTranslation();
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(5); // default 5km radius

  useEffect(() => {
    const fetchNearbyUsers = async () => {
      try {
        if (!navigator.geolocation) {
          throw new Error(t('geolocation_not_supported'));
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const users = await getNearbyUsers(latitude, longitude, radius);
            setNearbyUsers(users);
            setLoading(false);
          },
          (err) => {
            setError(t('location_access_denied'));
            setLoading(false);
          }
        );
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchNearbyUsers();
  }, [radius, t]);

  return (
    <div className="nearby-friends">
      <h2>{t('nearby_friends')}</h2>
      <div className="radius-selector">
        <label>{t('search_radius')}: </label>
        <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
          <option value={1}>1 km</option>
          <option value={5}>5 km</option>
          <option value={10}>10 km</option>
          <option value={20}>20 km</option>
        </select>
      </div>
      
      {loading && <p>{t('loading')}...</p>}
      {error && <p className="error">{error}</p>}
      
      <div className="users-list">
        {nearbyUsers.map(user => (
          <div key={user._id} className="user-card">
            <img src={user.profilePicture} alt={user.name} />
            <h3>{user.name}</h3>
            <p>{user.distance.toFixed(1)} km away</p>
            <button>{t('add_friend')}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NearbyFriends;
