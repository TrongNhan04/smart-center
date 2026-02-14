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
          { path: 'home', element: <div>Trang home</div> },
          
          { path: 'courses', element: <CourseList /> },
          { path: 'courses/:id', element:<CourseDetail/> },
          
          { path: 'classes', element: <ClassList/> },
          { path: 'classes/:id', element: <ClassDetail/>},

          { path: 'teachers', element: <div>Trang giáo viên</div> },
          { path: 'students', element: <div>Trang học viên</div> },
          { path: 'enrolls', element: <div>Trang ghi danh</div> },
          { path: 'invoices', element: <div>Trang hóa đơn</div> },
          { path: 'debts', element: <div>Trang nợ xấu</div> },
          { path: 'account', element: <div>Trang tài khoản</div> }
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