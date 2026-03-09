import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "../store/useAuthStore"

interface Props {
  allowedRole: 'ADMIN'|'TEACHER'
}

const PrivateRoute = ({ allowedRole }: Props) => {
  const token = useAuthStore(state => state.access_token)
  const role = useAuthStore(state => state.user?.role)

  // không có token hay role -> về đăng nhập
  // replace: không bấm nút quay lại được
  if (!token || !role) return <Navigate to='/' replace />

  // có token nhưng sai role -> đi lạc thì ai về nhà nấy
  if (!allowedRole.includes(role)) {
    if (role === 'ADMIN') return <Navigate to='/admin' replace />
    if (role === 'TEACHER') return <Navigate to='/teacher' replace />
    return <Navigate to='/' replace />
  }

  // có token, đúng role -> vào
  return <Outlet/>
}

export default PrivateRoute

// Người dùng vào /admin/dashboard. (trang có private PrivateRoute bảo vệ)

// PrivateRoute chạy: Kiểm tra localStorage. Thấy rỗng -> Đá về /.

// Người dùng nhập User/Pass -> Bấm Login.

// onFinish chạy: Gọi API -> Lấy Token -> Lưu vào localStorage -> Chuyển hướng /admin/dashboard.

// PrivateRoute chạy lại: Thấy có Token -> Cho qua (Outlet).

// Vào Dashboard, gọi API lấy danh sách học sinh.

// axiosClient chạy: Tự động nhét Token vào Header gửi lên Server.

// Server thấy Token hợp lệ -> Trả dữ liệu.

