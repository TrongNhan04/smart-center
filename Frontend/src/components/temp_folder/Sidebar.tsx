import React, { useState } from 'react';
import {
  BookOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  FormOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  NotificationOutlined,
  ReadOutlined,
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
import { useAuthStore } from '../../store/useAuthStore';

const { Header, Sider, Content } = Layout

type MenuItem = Required<MenuProps>['items'][number]

const Sidebar = () => {
  const navigate = useNavigate()
  const [darkTheme, setDarkTheme] = useState(true)
  const user = useAuthStore(state => state.user)
  const [collapsed, setCollapsed] = useState(false)

  const isAdmin = user?.role === 'ADMIN'
  const { token: { colorBgContainer } } = theme.useToken()

  const getItem = (
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
  ): MenuItem => {
    return {
      key,
      icon,
      children,
      label,
    } as MenuItem
  }

  const items: MenuItem[] = isAdmin ? [
    getItem('Tổng quan', 'dashboard', <DashboardOutlined />),
    getItem('Thời khóa biểu', 'schedules', <CalendarOutlined/>),
    getItem('Thông báo', 'notis', <NotificationOutlined />),
    getItem('Đào tạo', 'train', <BookOutlined />, [
      getItem('Khóa học', 'courses'),
      getItem('Lớp học', 'classes'),
    ]),
    getItem('Người dùng', 'users', <TeamOutlined />, [
      getItem('Giáo viên', 'teachers'),
      getItem('Học viên', 'students'),
    ]),
    getItem('Ghi danh', 'enrolls', <FormOutlined />),
    getItem('Tài chính', 'finances', <CreditCardOutlined />, [
      getItem('Hóa đơn', 'invoices'),
      getItem('Tổng hợp', 'receipts-payments')
    ]),
    getItem('Tài khoản', 'account', <UserOutlined />),
  ]
  // không phải admin thì menu của giáo viên
  : [
    getItem('Thời khóa biểu', 'schedules', <CalendarOutlined/>),
    getItem('Thông báo', 'notis', <NotificationOutlined/>),
    getItem('Lớp của tôi', 'classes', <ReadOutlined/>),
    getItem('Tài khoản', 'account', <UserOutlined />)
  ]

  const handleToggleTheme = () => {
    setDarkTheme(!darkTheme)
  }

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
          alignItems: 'center',
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
  )
}
export default Sidebar