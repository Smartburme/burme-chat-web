import { useState, useEffect } from 'react';
import { Tabs, Table, Tag, Button, message } from 'antd';
import api from '../../services/api';

const { TabPane } = Tabs;

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, reportsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/reports')
      ]);
      setUsers(usersRes.data);
      setReports(reportsRes.data);
    } catch (err) {
      message.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/ban`);
      message.success('User banned successfully');
      fetchData();
    } catch (err) {
      message.error('Failed to ban user');
    }
  };

  const userColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isBanned ? 'red' : 'green'}>
          {record.isBanned ? 'Banned' : 'Active'}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          danger 
          onClick={() => handleBanUser(record._id)}
          disabled={record.isBanned}
        >
          Ban
        </Button>
      )
    }
  ];

  const reportColumns = [
    {
      title: 'Reported User',
      dataIndex: ['reportedUser', 'name'],
      key: 'reportedUser'
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status'
    }
  ];

  return (
    <div className="admin-panel">
      <Tabs defaultActiveKey="1">
        <TabPane tab="User Management" key="1">
          <Table 
            columns={userColumns} 
            dataSource={users} 
            loading={loading}
            rowKey="_id"
          />
        </TabPane>
        <TabPane tab="Report Management" key="2">
          <Table 
            columns={reportColumns} 
            dataSource={reports} 
            loading={loading}
            rowKey="_id"
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
