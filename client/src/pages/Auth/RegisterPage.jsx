import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useTranslation } from 'react-i18next';

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await authService.register(values);
      message.success(t('register_success'));
      navigate('/login');
    } catch (err) {
      message.error(err.response?.data?.message || t('register_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{t('register')}</h1>
        <Form
          name="register"
          onFinish={onFinish}
          scrollToFirstError
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: t('name_required') }]}
          >
            <Input prefix={<UserOutlined />} placeholder={t('full_name')} />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('email_required') },
              { type: 'email', message: t('invalid_email') }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder={t('email')} />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('password_required') }]}
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('password')} />
          </Form.Item>

          <Form.Item
            name="confirm"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: t('confirm_password_required') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('password_mismatch')));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('confirm_password')} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t('register')}
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-links">
          <Link to="/login">{t('already_have_account')}</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
