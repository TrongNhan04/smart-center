import React, { useState } from 'react';
import {
  BookOutlined,
  CreditCardOutlined,
  FormOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Layout, Menu, theme } from 'antd';
import Logo from './Logo';
import '../../index.css';
import Toggle from './Toggle';
import HeaderCN from './Header';
import { Outlet, useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem('Trang chủ', 'home', <HomeOutlined />),
  getItem('Đào tạo', 'train', <BookOutlined />, [
    getItem('Khóa học', 'courses'),
    getItem('Lớp học', 'classes'),
  ]),
  getItem('Người dùng', 'users', <TeamOutlined />, [
    getItem('Giáo viên', 'teachers'),
    getItem('Học viên', 'students'),
  ]),
  getItem('Ghi danh', 'enrolls', <FormOutlined />),
  getItem('Hóa đơn', 'invoices', <CreditCardOutlined />),
  getItem('Tài khoản', 'account', <UserOutlined />),
];

const SidebarComponent = () => {
  const navigate = useNavigate()
  const [darkTheme, setDarkTheme] = useState(true)
  const handleToggleTheme = () => {
    setDarkTheme(!darkTheme)
  }
  const [collapsed, setCollapsed] = useState(false);
  const { token: { colorBgContainer } } = theme.useToken();

  const handleMenuclick = (e: { key: string }) => {
    navigate(`${e.key}`)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed}
        trigger={null} theme={darkTheme ? 'dark' : 'light'} >
        <Logo />
        <Menu
          theme={darkTheme ? 'dark' : 'light'}
          defaultSelectedKeys={['1']}
          mode="inline" items={items}
          onClick={handleMenuclick} />
        <Toggle darkTheme={darkTheme} toggleTheme={handleToggleTheme} />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 16px',
          background: colorBgContainer,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Button
            className='toggle'
            onClick={() => setCollapsed(!collapsed)}
            type='text'
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          />
          <HeaderCN />
        </Header>
        <Content>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default SidebarComponent;