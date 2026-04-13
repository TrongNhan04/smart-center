import { Button, message, notification, Popconfirm, Space, Tooltip } from "antd"
import type { TeacherDB } from "./TeacherDTO"
import { DeleteOutlined, EditOutlined, UndoOutlined } from "@ant-design/icons"
import teacherApi from "../../api/teacherApi"
import { CatchError } from "../common/catch.error"

interface Props {
  teacher: TeacherDB,
  onReload: (classId: number) => void
  onEdit: (teacher: TeacherDB) => void
}

const TeacherAction = ({ teacher, onReload, onEdit }: Props) => {

  const handleOnRestore = async (teacherId: number) => {
    try {
      await teacherApi.restore(teacherId)
      message.success('Thao tác thành công')
      onReload(teacherId)
    } catch (error: any) {
      CatchError.HandleError(error)
    }
  }

  const handleOnInactive = async (teacherId: number) => {
    try {
      await teacherApi.delete(teacherId)
      message.success('Thao tác thành công')
      onReload(teacherId)
    } catch (error: any) {
      CatchError.HandleError(error)
    }
  }

  if (teacher.TrangThai === 'INACTIVE')
    return (
      <Space >
        <Tooltip title="Khôi phục giáo viên">
          <Popconfirm
            title="Khôi phục giáo viên này?"
            okText="Khôi phục"
            cancelText="Hủy"
            onConfirm={() => handleOnRestore(teacher.ID)}
          >
            <Button
              type="link"
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
      <Tooltip title="Sửa thông tin">
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => onEdit(teacher)}
        >
        </Button>
      </Tooltip>

      {/* Nút xóa */}
      <Tooltip title="Vô hiệu hóa">
        <Popconfirm
          title="Xác nhận vô hiệu hóa?"
          description="Giáo viên này sẽ ngừng hoạt động!"
          okText="Vô hiệu hóa"
          cancelText="Hủy"
          onConfirm={() => handleOnInactive(teacher.ID)}
          okButtonProps={{ danger: true }}
        >
          <Button
            size="small"
            icon={<DeleteOutlined />}
            type="text"
            danger
          />
        </Popconfirm>
      </Tooltip>
    </Space>
  )
}

export default TeacherAction