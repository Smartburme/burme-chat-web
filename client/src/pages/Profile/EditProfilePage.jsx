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

  const handleUploadChange = ({ fileList }) => setFileList(fileList);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('profilePicture', fileList[0].originFileObj);
      }
      
      Object.keys(values).forEach(key => {
        if (values[key]) formData.append(key, values[key]);
      });

      await api.patch('/users/me', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      message.success(t('profile_updated'));
    } catch (err) {
      message.error(t('profile_update_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-profile-page">
      <h1>{t('edit_profile')}</h1>
      
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
      >
        <Form.Item
          name="name"
          label={t('name')}
          rules={[{ required: true, message: t('name_required') }]}
        >
          <Input prefix={<UserOutlined />} />
        </Form.Item>

        <Form.Item
          name="email"
          label={t('email')}
          rules={[
            { required: true, message: t('email_required') },
            { type: 'email', message: t('invalid_email') }
          ]}
        >
          <Input prefix={<MailOutlined />} disabled />
        </Form.Item>

        <Form.Item
          name="bio"
          label={t('bio')}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item
          label={t('profile_picture')}
        >
          <Upload
            listType="picture-card"
            fileList={fileList}
            beforeUpload={beforeUpload}
            onChange={handleUploadChange}
            maxCount={1}
          >
            {fileList.length < 1 && (
              <div>
                <EditOutlined />
                <div style={{ marginTop: 8 }}>{t('upload')}</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {t('save_changes')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default EditProfilePage;
