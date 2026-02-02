import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "../store/useAuthStore"

const PrivateRoute = () => {
  const token = useAuthStore(state => state.access_token)
  // return token ? <Outlet/> : <Navigate to="/login"/>
  return token ? <Outlet/> : <Navigate to="/"/>
}

export default PrivateRoute