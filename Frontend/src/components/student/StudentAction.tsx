import { Button, message, notification, Popconfirm, Space, Tooltip } from "antd"
import { studentApi } from "../../api/studentApi"
import type { StudentDB } from "./StudentDTO"
import { DeleteOutlined, EditOutlined } from "@ant-design/icons"

interface Props {
  student: StudentDB,
  onEdit: (student: StudentDB) => void,
  // onReload: (studentId: number) => void
  onReload: (q:string) => void
}

const StudentAction = ({ student, onEdit, onReload }: Props) => {
  const handleOnInactive = async (studentId: number) => {
    try {
      await studentApi.delete(studentId)
      message.success('Thao tác thành công')
      onReload('')
    } catch (error: any) {
      notification.error({
        title: 'Có lỗi xảy ra',
        description: error.response.data.message,
        showProgress: true,
        pauseOnHover: true
      })
      console.log('Có lỗi xảy ra: ', error.response.data.message)
    }
  }

  if (student.TrangThai !== 'INACTIVE')
    return (
      <Space size="small">
        {/* Nút sửa  */}
        <Tooltip title="Sửa thông tin">
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onEdit(student)}
          >
          </Button>
        </Tooltip>

        {/* Nút xóa */}
        <Tooltip title="Vô hiệu hóa">
          <Popconfirm
            title="Xác nhận vô hiệu hóa?"
            description="Thao tác này xác nhận học viên đã nghỉ học!"
            okText="Vô hiệu hóa"
            cancelText="Hủy"
            onConfirm={() => handleOnInactive(student.ID)}
            okButtonProps={{ danger: true }}
          >
            <Button size="small" icon={<DeleteOutlined />} type="primary" danger></Button>
          </Popconfirm>
        </Tooltip>
      </Space>
    )

  return (
    <>Không thể thao tác</>
  )
}

export default StudentAction