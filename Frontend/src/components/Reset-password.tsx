import { LockOutlined } from '@ant-design/icons'
import { Button, Card, Input, Form, message } from 'antd'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CatchError } from './common/catch.error'
import { authApi } from '../api/authApi'

const ResetPassword = () => {
  const [searchParam] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const token = searchParam.get('token')
  const navigate = useNavigate()

  const onFinish = async (value: any) => {
    try {
      setLoading(true)
      const payload = { token, ...value}
      await authApi.resetPw(payload)
      message.success('Đổi mật khẩu thành công!')
      navigate('/')
      
    } catch (error) {
      CatchError.HandleError(error)
    }
    finally{setLoading(false)}
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}>
      <Card title="Đổi mật khẩu" style={{ width: 400 }}>
        <Form layout='vertical' onFinish={onFinish}>
          <Form.Item
            label="Mật khẩu mới" name='password'
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }]}>
            <Input.Password
              size='large'
              prefix={<LockOutlined />}
              placeholder='...'
            />
          </Form.Item>

          <Button
            type="primary" htmlType="submit" 
            block loading={loading}>
            Xác nhận
          </Button>
        </Form>
      </Card>
    </div>
  )
}

export default ResetPassword