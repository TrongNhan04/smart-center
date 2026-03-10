import { useAuthStore } from "../../store/useAuthStore"
import { Button } from "antd"
import { authApi } from "../../api/authApi"

const HeaderCN = () => {

  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)

  const handleLogout = async () => {
    await authApi.logout() // đăng xuất backend
    logout() // đăng xuất frontend
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