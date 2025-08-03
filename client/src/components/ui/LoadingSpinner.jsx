import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const LoadingSpinner = ({ size = 24 }) => {
  return (
    <div className="loading-spinner">
      <Spin indicator={<LoadingOutlined style={{ fontSize: size }} spin />} />
    </div>
  );
};

export default LoadingSpinner;
