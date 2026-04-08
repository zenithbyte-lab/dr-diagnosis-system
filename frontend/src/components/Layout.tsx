import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import {
  EyeOutlined, UploadOutlined, HistoryOutlined,
  DashboardOutlined, UserOutlined, LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth';

const { Sider, Header, Content } = Layout;

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { key: '/', icon: <UploadOutlined />, label: 'New Diagnosis' },
    { key: '/history', icon: <HistoryOutlined />, label: 'History' },
    ...(user?.role === 'admin'
      ? [{ key: '/admin', icon: <DashboardOutlined />, label: 'Admin Dashboard' }]
      : []),
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={220} breakpoint="lg" collapsedWidth={80}>
        <div className="logo-area">
          <EyeOutlined style={{ fontSize: 24 }} />
          <span>DR Diagnosis</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <Dropdown
            menu={{
              items: [
                { key: 'info', label: `${user?.real_name || user?.username} (${user?.role})`, disabled: true },
                { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
              ],
              onClick: ({ key }) => { if (key === 'logout') { logout(); navigate('/login'); } },
            }}
          >
            <Button type="text" icon={<Avatar size="small" icon={<UserOutlined />} style={{ background: '#0e7490' }} />}>
              {' '}{user?.username}
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
