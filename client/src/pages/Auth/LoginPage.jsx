import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await authService.login(values);
      message.success(t('login_success'));
      navigate('/');
    } catch (err) {
      message.error(err.response?.data?.message || t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{t('login')}</h1>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('email_required') },
              { type: 'email', message: t('invalid_email') }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder={t('email')} />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('password_required') }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('password')} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t('login')}
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-links">
          <Link to="/register">{t('register_now')}</Link>
          <Link to="/forgot-password">{t('forgot_password')}</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
