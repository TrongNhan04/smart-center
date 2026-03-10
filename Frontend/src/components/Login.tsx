import { Button, Card, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../api/authApi';

const Login = () => {
  const navigate = useNavigate()
  //const user = useAuthStore(state => state.user)
  const login = useAuthStore(state => state.login)
  const onFinish = async (value: any) => {
    try {
      // gọi api login
      const response: any = await authApi.login(value)
      const role = response.data.user.role.toLowerCase()
      // lưu vào store
      login(response.data.user, response.data.access_token)

      message.success('Đăng nhập thành công')
      navigate(`/${role}`)
    }
    catch (error: any) {
      message.error('Sai Email hoặc mật khẩu')
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}>
        <Card title="Đăng nhập hệ thống" style={{ width: 400 }}>
          <Form onFinish={onFinish} layout="vertical">
            <Form.Item label="Email" name="email"
              rules={[{ required: true, message: 'Vui lòng nhập email!' }]}>
              <Input placeholder="Nhập email..." />
            </Form.Item>

            <Form.Item label="Mật khẩu" name="password"
              rules={[{ required: true, message: 'Nhập mật khẩu!' }]}>
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