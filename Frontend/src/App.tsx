import { Result } from "antd";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom"
import Login from "./components/Login";
import PrivateRoute from "./components/PrivateRoute";
import Sidebar from "./components/layout/Sidebar";
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
import Profile from "./components/account/Profile";
import MyClasses from "./components/page.teacher/MyClasses";
import TeacherRoute from "./components/page.teacher/TeacherRoute";
import SessionDetail from "./components/page.teacher/SessionDetail";
import ThongKeDiHoc from "./components/student/ThongKeDiHoc";
import SchedulePage from "./components/dashboard/SchedulePage";
import NotisList from "./components/dashboard/NotisList";
import NotisPage from "./components/page.teacher/NotisPage";
import ResetPassword from "./components/Reset-password";

const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />
  },
  {
    path:'/auth/reset-password',
    element: <ResetPassword/>
  },
  {
    element: <PrivateRoute allowedRole={'TEACHER'} />,
    children: [
      {
        path: 'teacher',
        element: <Sidebar />,
        children: [
          { index: true, element: <Navigate to="schedules" replace /> },
          { path: 'schedules', element: <SchedulePage /> },
          { path: 'notis', element:<NotisPage/>},
          { path: 'classes', element: <MyClasses /> },
          {
            path: 'classes/:classId',
            element: <TeacherRoute />,
            children: [
              { index: true, element: <ClassDetail /> },
              { path: 'sessions/:sessionId', element: <SessionDetail /> },
              { path: 'students/:studentId', element: <ThongKeDiHoc /> }
            ]
          },
          // { path: '',  },
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
        element: <Sidebar />, // trong này là outlet 2
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },

          { path: 'dashboard', element: <Dashboard /> },
          { path: 'notis', element: <NotisList /> },
          { path: 'schedules', element: <SchedulePage /> },

          { path: 'courses', element: <CourseList /> },
          { path: 'courses/:id', element: <CourseDetail /> },

          { path: 'classes', element: <ClassList /> },
          { path: 'classes/:classId', element: <ClassDetail /> },
          { path: 'classes/:classId/sessions/:sessionId', element: <SessionDetail /> },

          { path: 'teachers', element: <TeacherList /> },
          { path: 'teachers/:id', element: <TeacherDetail /> },

          { path: 'students', element: <StudentList /> },
          { path: 'students/:id', element: <StudentDetail /> },
          { path: 'students/:studentId/classes/:classId', element: <ThongKeDiHoc /> },

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