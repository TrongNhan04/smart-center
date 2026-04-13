import { Button, Popconfirm, Space, Tooltip } from "antd"
import type { ClassDB } from "./ClassDTO"
import { DeleteOutlined, EditOutlined, LockOutlined } from "@ant-design/icons"

interface Props {
  lophoc: ClassDB,
  onEdit: (data: ClassDB) => void
  onSoftDelete: (classId: number) => void
}

const ClassAction = ({ lophoc, onEdit, onSoftDelete }: Props) => {
  // nếu là open thì sửa, xóa
  // runing thì sửa 
  // còn lại thì không thể thao tác
  if (lophoc.TrangThai === 'OPEN')
    return (
      <Space size="small">
        {/* Nút sửa  */}
        <Tooltip title="Sửa thông tin">
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(lophoc)}
          >
          </Button>
        </Tooltip>

        {/* Nút xóa */}
        <Tooltip title="Đóng lớp lớp học">
          <Popconfirm
            title="Xác nhận đóng?"
            description="Hành động này sẽ không thể hoàn tác!"
            okText="Đóng"
            cancelText="Hủy"
            onConfirm={() => onSoftDelete(lophoc.ID)}
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              type="link" 
              danger
            />
          </Popconfirm>
        </Tooltip>
      </Space>
    )
  else if (lophoc.TrangThai === 'RUNNING')
    return (
      <Space size="small">
        {/* Nút sửa  */}
        <Tooltip title="Sửa & xem chi tiết">
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(lophoc)}
          >
          </Button>
        </Tooltip>
      </Space>
    )

  return (
    <Tooltip title='Không thể thao tác'>
      <Button icon={<LockOutlined/>} type="text"/>
    </Tooltip>
  )
}

export default ClassAction