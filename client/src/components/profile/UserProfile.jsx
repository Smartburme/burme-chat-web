import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUserProfile } from '../../services/profileService';

const UserProfile = ({ currentUser }) => {
  const { t } = useTranslation();
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile(userId);
        setProfile(data);
        setIsFriend(data.friends.includes(currentUser._id));
        setIsCurrentUser(userId === currentUser._id);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, currentUser._id]);

  const handleFriendAction = async () => {
    try {
      if (isFriend) {
        // Remove friend logic
        await removeFriend(currentUser._id, userId);
      } else {
        // Add friend logic
        await addFriend(currentUser._id, userId);
      }
      setIsFriend(!isFriend);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>{t('loading')}...</p>;
  if (!profile) return <p>{t('profile_not_found')}</p>;

  return (
    <div className="user-profile">
      <div className="profile-header">
        <img 
          src={profile.profilePicture || '/default-profile.png'} 
          alt={profile.name} 
          className="profile-picture"
        />
        <h1>{profile.name}</h1>
        {!isCurrentUser && (
          <button onClick={handleFriendAction}>
            {isFriend ? t('remove_friend') : t('add_friend')}
          </button>
        )}
      </div>
      
      <div className="profile-details">
        <h2>{t('about')}</h2>
        <p>{profile.bio || t('no_bio')}</p>
        
        <h2>{t('interests')}</h2>
        <div className="interests">
          {profile.interests?.length > 0 ? (
            profile.interests.map(interest => (
              <span key={interest} className="interest-tag">{interest}</span>
            ))
          ) : (
            <p>{t('no_interests')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
