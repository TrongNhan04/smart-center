import { Navigate, Outlet, useParams } from "react-router-dom"
import { useAuthStore } from "../../store/useAuthStore"

const TeacherRoute = () => {
  const {id} = useParams()
  const user = useAuthStore(state=>state.user)
  const classId = Number(id)
  if(!user?.classes.includes(classId))
    return <Navigate to='/404'/>
  return <Outlet/>
}

export default TeacherRoute