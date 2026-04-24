import { Button, Card, Form, Input, message, Modal, notification } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../api/authApi';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { CatchError } from './common/catch.error';

const Login = () => {
  const navigate = useNavigate()
  const login = useAuthStore(state => state.login)
  const [isOpen, setIsOpen] = useState(false)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onFinish = async (value: any) => {
    try {
      // gọi api login
      const response: any = await authApi.login(value)
      const role = response.data.user.role.toLowerCase()
      // lưu vào store
      const { children, ...rest } = response.data.user
      login(rest, response.data.access_token)

      message.success('Đăng nhập thành công')
      navigate(`/${role}`)
    }
    catch (error: any) {
      message.error('Sai Email hoặc mật khẩu')
    }
  }

  const handleOK = async () => {
    try {
      setLoading(true)
      const value = await form.validateFields()
      // console.log(value)
      await authApi.forgotPw(value)      
      notification.success({
        title: 'Đã gửi email đặt lại mật khẩu',
        //description: error?.response?.data?.message,
        showProgress: true,
        pauseOnHover: true
      })
    } catch (error) {
      CatchError.HandleError(error)
    }
    finally {
      setLoading(false)
      form.resetFields()
      setIsOpen(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}>
        <Card title="Đăng nhập hệ thống" style={{ width: 400 }}>

          <Form onFinish={onFinish} layout="vertical">
            <Form.Item
              label="Email" name="email"
              rules={[{ required: true, message: 'Vui lòng nhập email!' }]}>
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập email..." />
            </Form.Item>

            <Form.Item
              label="Mật khẩu" name="password"
              rules={[{ required: true, message: 'Nhập mật khẩu!' }]}>
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu..." />
            </Form.Item>

            <Form.Item style={{ textAlign: "right" }}>
              <Button type="link"
                onClick={() => setIsOpen(true)}>
                Quên mật khẩu?
              </Button>
            </Form.Item>

            <Button type="primary" htmlType="submit" block>
              Đăng nhập
            </Button>
          </Form>
        </Card>
      </div>

      <Modal
        title='Email đặt lại mật khẩu'
        open={isOpen}
        onCancel={() => { setIsOpen(false); form.resetFields() }}
        onOk={handleOK}
        width={400}
        okText="Xác nhận"
        cancelText="Hủy"
        centered // canh giữa màn hình
        maskClosable={false}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
           name="email"
            rules={[{ required: true, message: 'Vui lòng nhập email!' }]}>
            <Input
              size='large'
              prefix={<UserOutlined />}
              placeholder="Nhập email..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default Login