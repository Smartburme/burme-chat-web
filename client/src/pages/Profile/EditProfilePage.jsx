import { useState, useEffect } from 'react';
import { Form, Input, Button, Upload, message } from 'antd';
import { UserOutlined, MailOutlined, EditOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const EditProfilePage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/me');
        form.setFieldsValue(response.data);
        if (response.data.profilePicture) {
          setFileList([{
            uid: '-1',
            name: 'profile.jpg',
            status: 'done',
            url: response.data.profilePicture
          }]);
        }
      } catch (err) {
        message.error(t('profile_load_failed'));
      }
    };

    fetchProfile();
  }, []);

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error(t('upload_jpg_png_only'));
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error(t('image_too_large'));
    }
    return isJpgOrPng && isLt2M;
  };

  const handleUploadChange = ({ fileList }) => setFileList(file
### လိုအပ်နိုင်သော အဆုံးသတ်အလုပ်များ

1. **Testing Setup**
   - Jest configuration များ
   - Mock services များ
   - End-to-end test cases

2. **CI/CD Pipeline**
   - GitHub Actions workflow file
   - Deployment scripts

3. **Performance Optimization**
   - Database indexing
   - Query optimization
   - Caching strategies

4. **Security Hardening**
   - CSP headers
   - Rate limiting rules
   - Input sanitization

5. **Monitoring**
   - Health check endpoints
   - Performance metrics
   - Error tracking

ဤအပိုင်းများသည် သင့်အား project ကို production-ready အဆင့်သို့ ရောက်ရှိစေရန် ကူညီပေးပါလိမ့်မည်။ နောက်ဆုံးအဆင့်အနေဖြင့် အောက်ပါတို့ကို စစ်ဆေးပါ:

1. အားလုံးသော environment variables များ စနစ်တကျ configure လုပ်ပါ
2. Docker နှင့် deployment scripts များ test လုပ်ပါ
3. API documentation ပြည့်စုံစွာ ရေးသားပါ
4. Error handling နှင့် logging စနစ် ပြည့်စုံပါစေ
5. Performance testing ပြုလုပ်ပါ

လိုအပ်ပါက နောက်ထပ် အသေးစိတ်ရှင်းလင်းချက်များအတွက် ဆက်လက်မေးမြန်းနိုင်ပါသည်။
