import { SafetyOutlined, UserOutlined } from "@ant-design/icons"
import {
  Avatar, Button, Card, Col, Form, Input, message, notification,
  Row, Select, Typography
} from "antd"
import { useAuthStore } from "../../store/useAuthStore"
import { useState } from "react"
import { getChangedValue } from "../common/utils"
import { authApi } from "../../api/authApi"
import ChangePw from "./ChangePw"
import { CatchError } from "../common/catch.error"

const { Title, Text } = Typography

const Profile = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const user = useAuthStore(state => state.user)
  const update = useAuthStore(state => state.update)
  const logout = useAuthStore(state => state.logout)

  const role = user?.role === 'TEACHER' ? 'Giáo viên' : 'Admin'
  const handleUpdate = async () => {
    setLoading(true)
    try {
      const values = await form.validateFields()
      const paload = {
        ...values,
        id: user?.id,
        must_change_pw: user?.must_change_pw,
        classes: user?.classes
      }
      
      const updateData = getChangedValue(user, paload)
      if (Object.keys(updateData).length === 0) {
        message.info('Không có thông tin nào thay đổi')
        return
      }

      const res = await authApi.update(updateData)
      form.resetFields()
      form.setFieldsValue(res.data)
      update(res.data)
      let successMgs = 'Cập nhật thành công'
      if (Object.keys(updateData).includes('email')){
        successMgs += ', vui lòng đăng nhập lại!'
        logout()
      }
      message.success(successMgs)
    } catch (error: any) {
      CatchError.HandleError(error)
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '91vh' }}>
      <Title level={3} style={{ marginTop: 0, marginBottom: 24 }}>Thông tin tài khoản</Title>

      <Row gutter={[24, 24]}>   
        <Col xs={24} md={8} lg={6}>
          <Card
            variant='borderless'
            style={{ borderRadius: 8, textAlign: 'center'}}
          >
            <Avatar
              size={140}
              icon={<UserOutlined />}
              style={{ marginBottom: 16, border: '2px solid #f0f0f0' }}
            />
            <Title level={4} style={{ margin: 0 }}>{user?.full_name}</Title>
            <Text type="secondary">{role}</Text>
          </Card>
        </Col>

        {/* form chỉnh sửa thông tin */}
        <Col xs={24} md={16} lg={18}>
          <Card
            title="Cập nhật tài khoản"
            variant='borderless'
            styles={{
              header: { backgroundColor: '#e6f4ff', color: '#0958d9' }
            }}
            extra={
              <Button type="text" danger icon={<SafetyOutlined />}
                onClick={() => setIsOpen(true)}
              >Đổi mật khẩu</Button>
            }
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={user!} // Đổ dữ liệu cũ vào form
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item // họ tên
                    label="Họ và tên"
                    name="full_name"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                  >
                    <Input placeholder="Nhập họ và tên" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item // chức vụ
                    label="Chức vụ" name='role'>
                    <Select options={[
                      { label: `${user?.role}`, value: `${user?.role}` }
                    ]} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item // email
                    label="Email liên hệ"
                    name="email"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email!' },
                      { type: 'email', message: 'Email không hợp lệ!' }
                    ]}
                  >
                    <Input placeholder="Nhập địa chỉ email" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item //điện thoại 
                    label="Số điện thoại"
                    name="phone"
                  >
                    <Input placeholder="Nhập số điện thoại" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item // nút lưu cập nhật
                style={{ marginBottom: 0, textAlign: 'right' }}>
                <Button type="primary" loading={loading}
                  onClick={handleUpdate}>
                  Lưu thay đổi
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <ChangePw
        open={isOpen}
        onCancel={() => { setIsOpen(false) }}
      />
    </div>
  )
}

export default Profile