import { DeleteOutlined, EditOutlined, UndoOutlined } from "@ant-design/icons"
import { Button, Popconfirm, Space, Tooltip } from "antd"
import type { CourseDB } from "./CourseInterface"

interface Props {
  course: CourseDB,
  onRestore: (course: CourseDB) => void
  onSoftDelete: (id: number) => void
  onEdit: (course: CourseDB) => void
}

const CourseAction = ({
  course,
  onRestore,
  onSoftDelete,
  onEdit
}: Props) => {
  if (course.TrangThai === 'INACTIVE')
    return (
      <Space size="small">
        <Tooltip title="Khôi phục khóa học">
          <Popconfirm
            title="Khôi phục khóa học này?"
            okText="Khôi phục"
            cancelText="Hủy"
            onConfirm={() => onRestore(course)}
          >
            <Button
              type="primary"
              ghost
              icon={<UndoOutlined />}
              size="small"
            >
            </Button>
          </Popconfirm>
        </Tooltip>
      </Space>
    )

  return (
    <Space size="small">
      {/* Nút sửa  */}
      <Tooltip title="Sửa & xem chi tiết">
        <Button
          size="small"
          type="primary"
          icon={<EditOutlined />}
          onClick={()=>onEdit(course)}
        >
        </Button>
      </Tooltip>

      {/* Nút xóa */}
      <Tooltip title="Xóa khóa học">
        <Popconfirm
          title="Xác nhận xóa?"
          description="Hành động này sẽ xóa tạm hoặc đóng khóa học"
          okText="Xóa"
          cancelText="Hủy"
          onConfirm={() => onSoftDelete(course.ID)}
          okButtonProps={{ danger: true }}
        >
          <Button size="small" icon={<DeleteOutlined />} type="primary" danger></Button>
        </Popconfirm>
      </Tooltip>
    </Space>
  )
}

export default CourseAction