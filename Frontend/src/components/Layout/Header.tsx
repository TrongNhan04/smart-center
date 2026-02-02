import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../../store/useAuthStore"
import { Button } from "antd"

const Header = () => {
  const navigate = useNavigate()

  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop:5, paddingRight:40 }}>
       {/* Nếu có user thì hiện tên, chưa có thì thôi */}
       {user && (
         <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Xin chào, <b>{user.email}</b> ({user.role})</span>
            <Button onClick={handleLogout} danger>Đăng xuất</Button>
         </div>
       )}
    </div>
  )
}

export default Header