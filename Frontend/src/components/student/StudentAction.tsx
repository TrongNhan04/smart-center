import { Button, message, Popconfirm, Space, Tooltip } from "antd"
import { studentApi } from "../../api/studentApi"
import type { StudentDB } from "./StudentDTO"
import { DeleteOutlined, EditOutlined, LockOutlined } from "@ant-design/icons"
import { CatchError } from "../common/catch.error"

interface Props {
  student: StudentDB,
  onEdit: (student: StudentDB) => void,
  onReload: (q: string) => void // có q để search
}

const StudentAction = ({ student, onEdit, onReload }: Props) => {
  const handleOnInactive = async (studentId: number) => {
    try {
      await studentApi.delete(studentId)
      message.success('Thao tác thành công')
      onReload('')
    } catch (error: any) {
      CatchError.HandleError(error)
    }
  }

  if (student.TrangThai !== 'INACTIVE')
    return (
      <Space size="small">
        {/* Nút sửa  */}
        <Tooltip title="Sửa thông tin">
          <Button
            size="small"
            type="link"
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
            <Button
              size="small"
              icon={<DeleteOutlined />}
              type="link"
              danger />
          </Popconfirm>
        </Tooltip>
      </Space>
    )

  return (
    <Tooltip title='Không thể thao tác'>
      <Button type="text" icon={<LockOutlined/>}/>
    </Tooltip>
  )
}

export default StudentAction