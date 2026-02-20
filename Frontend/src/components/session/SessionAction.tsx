import { Alert, Button, Form, Input, Modal, Popconfirm, Space, Tooltip } from "antd"
import type { SessionDB } from "./SessionDTO"
import { DeleteOutlined, InfoCircleOutlined, UnlockOutlined } from "@ant-design/icons"
import { useState } from "react"

interface Props {
  session: SessionDB,
  unlock: (sessionId: number) => void,
  onCancel: (sessionId: number, reason:string) => void
  onOpenDrawer: () => void
}

const SessionAction = ({ session, unlock, onCancel, onOpenDrawer }: Props) => {
  const [form] = Form.useForm()
  const [open, setOpen] = useState(false)

  const infoBtn = () => (
    <Tooltip title="Xem chi tiết">
      <Button
        size="small"
        type="primary"
        icon={<InfoCircleOutlined />}
        onClick={() => onOpenDrawer()}
      >
      </Button>
    </Tooltip>
  )

  const handleCancel = () => {
    form.resetFields()
    setOpen(false)
  }

  const handleOK = async () => {
    const reason = await form.validateFields()
    onCancel(session.ID, reason)
    form.resetFields()
    setOpen(false)
  }

  if (session.TrangThai === 'CANCELLED')
    return infoBtn()

  else if (session.YeuCauMoKhoa)
    return (
      <Space size="small">
        {/* Nút info  */}
        {infoBtn()}

        {/* Nút mở khóa */}
        <Tooltip title="Mở khóa">
          <Popconfirm
            title="Xác nhận mở khóa?"
            description="Thao này có thể thay đổi kết quả buổi học!"
            okText="Lưu"
            cancelText="Hủy"
            onConfirm={() => unlock(session.ID)}
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              icon={<UnlockOutlined />}
              type="primary" ghost danger
            />
          </Popconfirm>
        </Tooltip>
      </Space>
    )

  else if (session.AdminMoKhoa)
    return infoBtn()

  else if (session.TrangThai === 'SCHEDULED')
    return (
      <Space size="small">
        {/* Nút info  */}
        {infoBtn()}

        {/* nút hủy */}
        <Tooltip title="Hủy buổi học">
          <Button
            size="small"
            icon={<DeleteOutlined />}
            type="primary" danger
            onClick={()=>setOpen(true)}
          />
        </Tooltip>
        <Modal
          title="Xác nhận hủy buổi học" 
          open={open}
          onCancel={handleCancel}
          onOk={handleOK} 
          width={500}
          okText="Hủy buổi học" // Thay vì "Xác nhận" chung chung, hãy ghi rõ hành động
          okButtonProps={{ danger: true }}
          cancelText="Đóng"
          centered
          maskClosable={false}
        >
          <Alert
            title="Lưu ý quan trọng"
            description="Hành động này không thể hoàn tác, đồng thời sẽ tự động gửi thông báo đến phụ huynh!"
            type="warning"
            showIcon
            style={{ marginBottom: 20 }} // Tạo khoảng trống với Form bên dưới
          />

          <Form form={form} layout="vertical">
            <Form.Item 
              label={<b>Lý do hủy (Sẽ hiển thị trong thông báo)</b>} // In đậm và làm rõ mục đích của lý do
              name="reason"
              rules={[{ required: true, message: 'Vui lòng nhập lý do hủy!' }]}
              //style={{ marginBottom: 0 }} // Xóa margin thừa của Item cuối cùng để Modal gọn hơn
            >
              <Input.TextArea
                rows={4}
                placeholder="Vd: Trung tâm nghỉ lễ, giáo viên bận đột xuất..."
                showCount
                maxLength={250}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    )
  else return infoBtn()
}

export default SessionAction

// có yêu cầu mở -> info + mở khóa
// ko yêu cầu + admin ko mở + chưa COMPLETED -> info + hủy
// admin mở -> info
// status = CANCELLED ->info

          // <Popconfirm
          //   title="Xác nhận hủy?"
          //   description="Hành động này không thể hoàn tác và sẽ gửi thông báo 
          //   đến phụ huynh!"
          //   okText="Lưu"
          //   cancelText="Hủy"
          //   onConfirm={() => onCancel(session.ID)}
          //   okButtonProps={{ danger: true }}
          // >
          //   <Button
          //     size="small"
          //     icon={<DeleteOutlined />}
          //     type="primary" danger
          //   />
          // </Popconfirm>

          // <Modal
          //   open={open}
          //   onCancel={handleCancel}
          //   onOk={handleOK}
          //   width={600}
          //   okText="Lưu lại"
          //   cancelText="Hủy bỏ"
          //   centered // canh giữa màn hình
          //   maskClosable={false}
          // >
          //   <Form form={form}>
          //     <Form.Item
          //     label="Lý do"
          //     name="reason"
          //     rules={[{ required: true, message: 'Vui lòng nhập lý do!' }]}
          //   >
          //     <Input placeholder="Vd: Nghỉ lễ..." />
          //   </Form.Item>
          //   </Form>
          // </Modal>
