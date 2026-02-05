import { DeleteOutlined, EditOutlined, UndoOutlined } from "@ant-design/icons"
import { Button, Popconfirm, Space, Tooltip } from "antd"
import type { CourseType } from "./CourseInterface"

interface Props {
  course: CourseType,
  onEdit: (data: CourseType) => void,
  onSoftDelete: (id: number) => void,
  onRestore: (id: number) => void
}

const CourseAction = ({
  course,
  onEdit,
  onSoftDelete,
  onRestore
}: Props) => {
  if (course.TrangThai === 'INACTIVE')
    return (
      <Space size="small">
        <Tooltip title="Khôi phục khóa học">
          <Popconfirm
            title="Khôi phục khóa học này?"
            okText="Khôi phục"
            cancelText="Hủy"
            onConfirm={() => onRestore(course.ID)}
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
          onClick={(course:any) => onEdit(course)}
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