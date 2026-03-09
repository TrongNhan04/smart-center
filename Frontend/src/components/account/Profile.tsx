import { MailFilled, PhoneFilled, SafetyOutlined, UploadOutlined, UserOutlined } from "@ant-design/icons"
import { Avatar, Button, Card, Col, Divider, Form, Input, message, notification, Row, Select, Space, Typography, Upload } from "antd"
import { useAuthStore } from "../../store/useAuthStore"
import { useState } from "react"
import { getChangedValue } from "../common/utils"
import { authApi } from "../../api/authApi"
import ChangePw from "./ChangePw"

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

      const updateData = getChangedValue(user, values)
      if (Object.keys(updateData).length === 0) {
        message.info('Không có thông tin nào thay đổi')
        return
      }

      const res = await authApi.update(updateData)
      form.resetFields()
      form.setFieldsValue(res.data)
      update(res.data)
      message.success('Thao tác thành công')
      if (Object.keys(updateData).includes('email'))
        logout()
    } catch (error: any) {
      notification.error({
        title: 'Có lỗi xảy ra',
        description: error?.response?.data?.message,
        showProgress: true,
        pauseOnHover: true
      })
      console.log('Có lỗi xảy ra: ', error?.response?.data?.message)
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '91vh' }}>
      <Title level={3} style={{ marginTop: 0, marginBottom: 24 }}>Thông tin tài khoản</Title>

      <Row gutter={[24, 24]}>
        {/* CỘT TRÁI: THẺ AVATAR & NHẬN DIỆN */}
        <Col xs={24} md={8} lg={6}>
          <Card
            variant='borderless'
            style={{
              borderRadius: 8, textAlign: 'center'
            }}
          >
            <Avatar
              size={140}
              src={'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'}
              icon={<UserOutlined />}
              style={{ marginBottom: 16, border: '2px solid #f0f0f0' }}
            />
            <Title level={4} style={{ margin: 0 }}>{user?.full_name}</Title>
            <Text type="secondary">{role}</Text>

            <Divider dashed />

            <Space orientation="vertical" style={{ width: '100%', textAlign: 'left' }}>
              <Text type="secondary"><MailFilled /> {user?.email}</Text>
              <Text type="secondary"><PhoneFilled /> {user?.phone}</Text>
            </Space>

            <Divider dashed />

            <Upload showUploadList={false}>
              <Button icon={<UploadOutlined />} block>Đổi Ảnh Đại Diện</Button>
            </Upload>
          </Card>
        </Col>

        {/* CỘT PHẢI: FORM CHỈNH SỬA THÔNG TIN */}
        <Col xs={24} md={16} lg={18}>
          <Card
            title="Cập nhật thông tin cá nhân"
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
                      { label: 'Giáo viên', value: 'TEACHER' }
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

                <Col span={24}>
                  <Form.Item // địa chỉ
                    label="Địa chỉ hiện tại" name="address">
                    <Input.TextArea rows={3} placeholder="Nhập địa chỉ của bạn" />
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
        onCancel={()=>{setIsOpen(false)}}
      />
    </div>
  )
}

export default Profile