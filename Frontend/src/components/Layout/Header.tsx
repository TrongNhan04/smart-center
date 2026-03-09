import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../../store/useAuthStore"
import { Button } from "antd"

const HeaderCN = () => {
  const navigate = useNavigate()

  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>Xin chào, <b>{user?.full_name}</b> ({user?.role})</span>
        <Button onClick={handleLogout} size='small'
          type="primary">Đăng xuất</Button>
      </div>
    </>
  )
}

export default HeaderCN