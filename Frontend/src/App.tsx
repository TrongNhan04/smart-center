import { Result } from "antd";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom"
import Login from "./components/Login";
import PrivateRoute from "./components/PrivateRoute";
import SidebarComponent from "./components/layout/Sidebar";
import CourseList from "./components/course/CourseList";
import CourseDetail from "./components/course/CourseDetail";
import ClassList from "./components/class/ClassList";
import ClassDetail from "./components/class/ClassDetail";
import TeacherList from "./components/teacher/TeacherList";
import TeacherDetail from "./components/teacher/TeacherDetail";
import StudentList from "./components/student/StudentList";
import StudentDetail from "./components/student/StudentDetail";
import EnrollList from "./components/enroll/EnrollList";
import InvoiceList from "./components/invoice/InvoiceList";
import InvoiceDetail from "./components/invoice/InvoiceDetail";
import TongHopThuChi from "./components/invoice/TongHopThuChi";
import Dashboard from "./components/dashboard/Dashboard";
import TaskList from "./components/dashboard/TaskList";
import Profile from "./components/account/Profile";
import Schedule from "./components/page.teacher/Schedule";
import MyClasses from "./components/page.teacher/MyClasses";


const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />
  },
  {
    element: <PrivateRoute allowedRole={'TEACHER'} />,
    children: [
      {
        path: 'teacher',
        element: <SidebarComponent />,
        children: [
          { index: true, element: <Navigate to="schedules" replace /> },
          { path: 'schedules', element: <Schedule/> },
          { path: 'classes', element: <MyClasses/> },
          { path: 'classes/:id', element: <ClassDetail /> },
          { path: 'account', element: <Profile /> }
        ]
      }
    ]
  },
  {
    element: <PrivateRoute allowedRole={'ADMIN'} />,
    children: [ // toàn bộ children là outlet 1
      {
        path: 'admin',
        element: <SidebarComponent />, // trong này là outlet 2
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },

          { path: 'dashboard', element: <Dashboard /> },
          { path: 'tasks', element: <TaskList /> },

          { path: 'courses', element: <CourseList /> },
          { path: 'courses/:id', element: <CourseDetail /> },

          { path: 'classes', element: <ClassList /> },
          { path: 'classes/:id', element: <ClassDetail /> },

          { path: 'teachers', element: <TeacherList /> },
          { path: 'teachers/:id', element: <TeacherDetail /> },

          { path: 'students', element: <StudentList /> },
          { path: 'students/:id', element: <StudentDetail /> },

          { path: 'enrolls', element: <EnrollList /> },

          { path: 'invoices', element: <InvoiceList /> },
          { path: 'invoices/:id', element: <InvoiceDetail /> },

          { path: 'receipts-payments', element: <TongHopThuChi /> },

          { path: 'account', element: <Profile /> }
        ]
      }
    ]
  },
  {
    path: '*',
    element: <Result status='404' title='404' subTitle='Page not found' />
  }
])

const App = () => {
  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App

// Bước 1: Đi qua Cửa bảo vệ (<PrivateRoute />)
// React Router thấy route cha không có path cụ thể, chỉ có element: <PrivateRoute />. 
// Nó sẽ chạy component này đầu tiên.
// Logic kiểm tra: Role là ADMIN -> Chạy lệnh return <Outlet />.
// Kết quả: Cái <Outlet /> này lập tức được thay thế bằng component con 
// khớp với chữ admin trên URL. Tức là nó gọi ra <SidebarComponent />.
// Bước 2: Đi qua Cửa giao diện (<SidebarComponent />)
// Lúc này, <SidebarComponent /> đã được hiển thị lên màn hình 
// Bên trong <SidebarComponent /> lại có một cái <Outlet /> nữa.
// React Router tiếp tục đọc URL, thấy đoạn cuối là dashboard, 
// nó sẽ lấy component <Dashboard /> nhét vào vị trí của cái <Outlet /> thứ hai này.