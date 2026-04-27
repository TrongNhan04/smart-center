import { Alert, Button, Form, Input, message, Modal, Popconfirm, Space, Tooltip } from "antd"
import type { SessionDB } from "./SessionDTO"
import { CheckCircleFilled, CloseCircleFilled, DeleteOutlined, InfoCircleOutlined } from "@ant-design/icons"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CatchError } from "../common/catch.error"
import { sessionApi } from "../../api/sessionApi"

interface Props {
  session: SessionDB,
  unlock: (sessionId: number) => void,
  reload: () => void,
  onCancel: (sessionId: number, reason: string) => void
  // onOpenDrawer: (sessionId: number) => void
}

const SessionAction = ({ session, unlock, reload, onCancel }: Props) => {
  const [form] = Form.useForm()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const infoBtn = () => (
    <Tooltip title="Xem chi tiết">
      <Button
        size="small"
        type="link"
        icon={<InfoCircleOutlined />}
        onClick={() => navigate(`sessions/${session.ID}`)}
      >
      </Button>
    </Tooltip>
  )

  const handleRefuse = async () => {
    try {
      await sessionApi.refuseUnlock(session.ID)
      message.success('Thao tác thành công')
      reload()
    } catch (error) {
      CatchError.HandleError(error)
    }
  }

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
        <Tooltip title="Duyệt">
          <Popconfirm
            title="Xác nhận mở khóa?"
            description="Thao tác này có thể thay đổi kết quả buổi học!"
            okText="Xác nhận mở khóa"
            cancelText="Hủy"
            onConfirm={() => unlock(session.ID)}
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              icon={<CheckCircleFilled />}
              type="link"
              style={{ color: 'green' }}
            />
          </Popconfirm>
        </Tooltip>

        <Tooltip title="Từ chối">
          <Button
            onClick={handleRefuse}
            size="small"
            icon={<CloseCircleFilled />}
            type="link"
            style={{ color: 'red' }}
          />
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
            type="link" danger
            onClick={() => setOpen(true)}
          />
        </Tooltip>

        <Modal
          title="Xác nhận hủy buổi học"
          open={open}
          onCancel={handleCancel}
          onOk={handleOK}
          width={500}
          okText="Hủy buổi học"
          okButtonProps={{ danger: true }}
          cancelText="Đóng"
          centered
          maskClosable={false}
        >
          <Alert
            title="Lưu ý quan trọng"
            description="Hành động này không thể hoàn tác và
            tự động gửi thông báo đến phụ huynh!"
            type="warning"
            showIcon
            style={{ marginBottom: 20 }}
          />

          <Form form={form} layout="vertical">
            <Form.Item
              label={<b>Lý do hủy (Sẽ hiển thị trong thông báo)</b>}
              name="reason"
              rules={[{ required: true, message: 'Vui lòng nhập lý do!' }]}
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