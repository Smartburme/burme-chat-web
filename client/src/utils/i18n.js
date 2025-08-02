import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      welcome: "Welcome to Burme Chat",
      login: "Login",
      // ... other English translations
    }
  },
  my: {
    translation: {
      welcome: "Burme Chat မှကြိုဆိုပါသည်",
      login: "လော့ဂ်အင်",
      // ... other Burmese translations
    }
  },
  thi: {
    translation: {
      welcome: "ยินดีต้อนรับสู่ Burme Chat",
      login: "เข้าสู่ระบบ",
      // ... other Thai translations
    }
  },
  vnd: {
    translation: {
      welcome: "Chào mừng đến với Burme Chat",
      login: "Đăng nhập",
      // ... other Vietnamese translations
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
