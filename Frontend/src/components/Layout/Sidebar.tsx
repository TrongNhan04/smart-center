import Header from './Header';
import { Link, Outlet } from 'react-router-dom';

const SidebarComponent = () => {
  return (
    <><Header />
      <div style={{ display: 'flex' }}>
        <div className="sidebar" style={{ width: '200px', background: '#eee' }}>

          <h3>Menu</h3>
          <ul>
            <li><Link to="/admin/dashboard">Trang chủ</Link></li>
            <li><Link to="/admin/class">Quản lý lớp</Link></li>
            <li><Link to="/admin/course">Quản lý khóa</Link></li>
          </ul>
        </div>

        <div className="content" style={{ flex: 1, padding: '20px' }}>
          <Outlet />
        </div>
      </div>
    </>
  )
}

export default SidebarComponent