import { Result } from "antd";
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import ModalAD from "./components/ModalAd";
import Login from "./components/Login";
// import { useState } from "react";
import PrivateRoute from "./components/PrivateRoute";
import SidebarComponent from "./components/Layout/Sidebar";

const router = createBrowserRouter([
  // {
  //   path: '/',
  //   element: <PrivateRoute />
  // },
  {
    path: '/',
    element: <Login />
  },
  {
    // path: '/admin',
    element: <PrivateRoute />,
    children: [
      {
        path: '/admin',
        element: <SidebarComponent />,
        children: [
          { path: 'dashboard', element: <ModalAD /> },
          { path: 'class', element: <div>Trang lớp học</div> },
          { path: 'course', element: <div>Trang khóa học</div> }
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
      {/* <Test /> */}
    </>
  )
}

export default App
