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