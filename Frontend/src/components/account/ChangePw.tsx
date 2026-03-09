import { Form, Input, message, Modal, notification } from "antd"
import { useState } from "react"
import { authApi } from "../../api/authApi"
import { useAuthStore } from "../../store/useAuthStore"

interface Props {
  open: boolean
  onCancel: () => void
}

const ChangePw = ({ open, onCancel }: Props) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const handleOK = async () => {
    setLoading(true)
    try {
      const values = await form.validateFields()
      const { confirmPassword, ...rest } = values

      await authApi.update(rest)
      message.success('Thao tác thành công')
      handelCancel()
      useAuthStore.getState().logout()
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

  const handelCancel = () => {
    form.resetFields()
    onCancel()
  }
  return (
    <>
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* <LockOutlined style={{ color: '#ff4d4f' }} /> */}
            <span>Đổi mật khẩu bảo mật</span>
          </div>
        }
        open={open}
        onOk={handleOK}
        onCancel={handelCancel}
        okText="Cập nhật mật khẩu"
        cancelText="Hủy bỏ"
        okButtonProps={{ danger: true }}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 20 }}
        >

          <Form.Item // mật khẩu hiện tại
            label="Mật khẩu hiện tại"
            name="oldPassword"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu đang sử dụng" size="large" />
          </Form.Item>

          <Form.Item // mật khẩu mới
            label="Mật khẩu mới"
            name="newPassword"
            dependencies={['oldPassword']}
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              // { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
              ({ getFieldValue }) => ({
                validator(_, value) { //!value để check rỗng, nếu rỗng thì không báo lỗi
                  if (!value || getFieldValue('oldPassword') === value) {
                    return Promise.reject(new Error('Mật khẩu không thay đổi!'))
                  }
                  return Promise.resolve()
                },
              }),
            ]}
          >
            <Input.Password placeholder="Tạo mật khẩu mới (ít nhất 6 ký tự)" size="large" />
          </Form.Item>

          <Form.Item // xác nhận mật khẩu
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            dependencies={['newPassword']} // Báo cho form biết ô này phụ thuộc vào ô newPassword
            rules={[
              { required: true, message: 'Vui lòng xác nhận lại mật khẩu mới!' },
              // Logic kiểm tra 2 mật khẩu có khớp nhau không 
              ({ getFieldValue }) => ({
                validator(_, value) { //!value để check rỗng, nếu rỗng thì không báo lỗi
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới một lần nữa" size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default ChangePw