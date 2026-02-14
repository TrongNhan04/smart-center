import { Button, Popconfirm, Space, Tooltip } from "antd"
import type { ClassDB } from "./ClassDTO"
import { DeleteOutlined, EditOutlined } from "@ant-design/icons"

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
        <Tooltip title="Sửa & xem chi tiết">
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onEdit(lophoc)}
          >
          </Button>
        </Tooltip>

        {/* Nút xóa */}
        <Tooltip title="Xóa lớp học">
          <Popconfirm
            title="Xác nhận xóa?"
            description="Hành động này sẽ không thể hoàn tác!"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => onSoftDelete(lophoc.ID)}
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              type="primary" danger
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
            type="primary"
            icon={<EditOutlined />}
            onClick={()=>onEdit(lophoc)}
          >
          </Button>
        </Tooltip>
      </Space>
    )
  else
    return (
      <>Không thể thao tác</>
    )
}

export default ClassAction