import { Navigate, Outlet, useParams } from "react-router-dom"
import { useAuthStore } from "../../store/useAuthStore"

const TeacherRoute = () => {
  const {classId} = useParams()
  const user = useAuthStore(state=>state.user)
  const lopHocId = Number(classId)
  if(!user?.classes.includes(lopHocId))
    return <Navigate to='/404'/>
  return <Outlet/>
}

export default TeacherRoute