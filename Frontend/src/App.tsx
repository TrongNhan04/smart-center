import { Result } from "antd";
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Login from "./components/Login";
// import { useState } from "react";
import PrivateRoute from "./components/PrivateRoute";
import SidebarComponent from "./components/layout/Sidebar";
import CourseList from "./components/course/CourseList";
import HeaderCN from "./components/layout/Header";
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

const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />
  },
  {
    path: 'teacher',
    element: <div>Trang giáo viên vận hành<HeaderCN /></div>
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        path: 'admin',
        element: <SidebarComponent />,
        children: [
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

          { path: 'account', element: <div>trang tài khoản</div> }
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