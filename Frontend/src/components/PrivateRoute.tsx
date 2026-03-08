import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "../store/useAuthStore"

const PrivateRoute = () => {
  const token = useAuthStore(state => state.access_token)
  const role = useAuthStore(state => state.user?.role)
  if (token && role === 'ADMIN')
    return <Outlet />
  else if (token && role === 'TEACHER')
    return <Navigate to="/teacher" />
  else 
    return <Navigate to="/"/>
  //return token ? <Outlet/> : <Navigate to="/"/>
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