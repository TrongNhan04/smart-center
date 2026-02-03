import { Result } from "antd";
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Login from "./components/Login";
// import { useState } from "react";
import PrivateRoute from "./components/PrivateRoute";
import SidebarComponent from "./components/layout/Sidebar";
import CourseList from "./components/course/CourseList";

const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        path: '/admin',
        element: <SidebarComponent />,
        children: [
          { path: 'home', element: <div>Trang home</div>},
          { path: 'course', element: <CourseList/> },
          { path: 'class', element: <div>Trang lớp học</div> },
          { path: 'teacher', element: <div>Trang giáo viên</div> },
          { path: 'student', element: <div>Trang học viên</div> },
          { path: 'enroll', element: <div>Trang ghi danh</div> },
          { path: 'invoice', element: <div>Trang hóa đơn</div> },
          { path: 'debt', element: <div>Trang nợ xấu</div> },
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
