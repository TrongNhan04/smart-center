import { Button, Card, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../api/authApi';
import { useAuthStore } from '../store/useAuthStore';
// import { useState } from 'react';
// import axios from 'axios';

const Login = () => {
  const navigate = useNavigate()
 const login = useAuthStore(state => state.login)
  const onFinish = async (value: any) => {
    try {
     
      // gọi api login
      const response: any = await loginApi(value)
      console.log("login success: ", response)

      login(response.data.user, response.data.access_token)

      message.success('Login success')
      navigate('/admin')
    }
    catch (error: any) {
      message.error('Wrong password or account')
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}>
        <Card title="Đăng nhập hệ thống" style={{ width: 400 }}>
          <Form onFinish={onFinish} layout="vertical">
            <Form.Item label="Email" name="email" rules={[{ required: true }]}>
              <Input placeholder="Nhập email..." />
            </Form.Item>

            <Form.Item label="Mật khẩu" name="password" rules={[{ required: true }]}>
              <Input.Password placeholder="Nhập mật khẩu..." />
            </Form.Item>

            <Button type="primary" htmlType="submit" block>
              Đăng nhập
            </Button>
          </Form>
        </Card>
      </div>
    </>
  )
}

export default Login

// const [user, setUser] = useState<UserType>({})
// const [email, setEmail] = useState('')
// const [pw, setPW] = useState('')
// const [error, setError] = useState<string | null>(null)

// const getUser = (key: keyof UserType, value: string) => {
//   setUser({
//     ...user, [key]: value
//   })
// }

// const handleSubmit = async () =>{
//   try{
//     const res = await axios.post<UserResponse>
//     ('https://jsonplaceholder.typicode.com/users',
//       {id: 1, email:'gv@gmail.com', pw:'123', role:'teacher'})
//     console.log(res.data)
//     setEmail('')
//     setPW('')
//   }
//   catch(err){
//     console.log("Error posting data")
//     setError("Error posting data")
//   }
// }
// if(error) return <div>{error}</div>
