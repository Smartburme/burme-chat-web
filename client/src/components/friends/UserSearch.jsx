import { useState, useEffect } from 'react';
import { Input, List, Avatar, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import api from '../../services/api';

const UserSearch = ({ onSelectUser }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/users/search?q=${query}`);
        setResults(response.data);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchUsers, 500);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="user-search">
      <Input
        placeholder="Search users..."
        prefix={<SearchOutlined />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        allowClear
      />

      {results.length > 0 ? (
        <List
          className="search-results"
          dataSource={results}
          loading={loading}
          renderItem={(user) => (
            <List.Item 
              onClick={() => onSelectUser(user)}
              style={{ cursor: 'pointer' }}
            >
              <List.Item.Meta
                avatar={<Avatar src={user.profilePicture} />}
                title={user.name}
                description={user.email}
              />
            </List.Item>
          )}
        />
      ) : query.trim().length >= 2 && !loading ? (
        <Empty description="No users found" />
      ) : null}
    </div>
  );
};

export default UserSearch;
