import { useState } from 'react';
import { useTranslation, i18n } from 'react-i18next';

const SettingsPage = () => {
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    i18n.changeLanguage(newLanguage);
    setCurrentLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const handleNotificationToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // Save to user preferences in backend
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
    // Apply dark mode styles
  };

  return (
    <div className="settings-page">
      <h1>{t('settings')}</h1>
      
      <div className="setting-section">
        <h2>{t('language')}</h2>
        <select 
          value={currentLanguage} 
          onChange={handleLanguageChange}
          className="language-selector"
        >
          <option value="en">English</option>
          <option value="my">မြန်မာ (Burmese)</option>
          <option value="thi">ไทย (Thai)</option>
          <option value="vnd">Tiếng Việt (Vietnamese)</option>
        </select>
      </div>
      
      <div className="setting-section">
        <h2>{t('notifications')}</h2>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={notificationsEnabled}
            onChange={handleNotificationToggle}
          />
          <span className="slider round"></span>
        </label>
        <span className="setting-status">
          {notificationsEnabled ? t('enabled') : t('disabled')}
        </span>
      </div>
      
      <div className="setting-section">
        <h2>{t('dark_mode')}</h2>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={darkMode}
            onChange={handleDarkModeToggle}
          />
          <span className="slider round"></span>
        </label>
        <span className="setting-status">
          {darkMode ? t('enabled') : t('disabled')}
        </span>
      </div>
    </div>
  );
};

export default SettingsPage;
