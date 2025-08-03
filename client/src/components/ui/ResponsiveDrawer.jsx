import { useState, useEffect } from 'react';
import { Drawer, Button } from 'antd';
import { MenuOutlined } from '@ant-design/icons';

const ResponsiveDrawer = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <>
      {isMobile && (
        <Button 
          type="text" 
          icon={<MenuOutlined />} 
          onClick={() => setVisible(true)}
          className="drawer-button"
        />
      )}

      {isMobile ? (
        <Drawer
          placement="left"
          onClose={() => setVisible(false)}
          visible={visible}
          width={250}
        >
          {children}
        </Drawer>
      ) : (
        <div className="sidebar">
          {children}
        </div>
      )}
    </>
  );
};

export default ResponsiveDrawer;
