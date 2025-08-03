import { useState, useEffect, useMemo } from 'react';
import { Table, Tag, Button, Input, Select, message } from 'antd';
import { SearchOutlined, EditOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({});
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const params = {
          page: pagination.current,
          limit: pagination.pageSize,
          ...filters
        };
        const response = await api.get('/admin/users', { params });
        setUsers(response.data.users);
        setPagination(prev => ({
          ...prev,
          total: response.data.total
        }));
      } catch (err) {
        message.error(t('user_fetch_failed'));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [pagination.current, pagination.pageSize, filters]);

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStatusChange = async (userId, isBanned) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { isBanned });
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, isBanned } : user
      ));
      message.success(t('user_updated'));
    } catch (err) {
      message.error(t('update_failed'));
    }
  };

  const columns = [
    {
      title: t('name'),
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="user-cell">
          <img src={record.profilePicture} alt={text} className="user-avatar" />
          <span>{text}</span>
        </div>
      )
    },
    {
      title: t('email'),
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: t('status'),
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isBanned ? 'red' : 'green'}>
          {record.isBanned ? t('banned') : t('active')}
        </Tag>
      )
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (_, record) => (
        <Button
          type={record.isBanned ? 'primary' : 'danger'}
          onClick={() => handleStatusChange(record._id, !record.isBanned)}
        >
          {record.isBanned ? t('unban') : t('ban')}
        </Button>
      )
    }
  ];

  return (
    <div className="user-management">
      <div className="toolbar">
        <Input
          placeholder={t('search_users')}
          prefix={<SearchOutlined />}
          allowClear
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 300 }}
        />
        
        <Select
          placeholder={t('filter_status')}
          allowClear
          onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          style={{ width: 150 }}
          options={[
            { value: 'active', label: t('active') },
            { value: 'banned', label: t('banned') }
          ]}
        />
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="_id"
        loading={loading}
        pagination={pagination}
        onChange={(newPagination) => setPagination(newPagination)}
      />
    </div>
  );
};

export default UserManagement;
