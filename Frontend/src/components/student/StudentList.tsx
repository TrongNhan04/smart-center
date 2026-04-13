import { Badge, Button, Card, Col, Input, notification, Row, Select, Space, Table, Typography } from "antd"
import { useEffect, useState } from "react"
import type { StudentDB } from "./StudentDTO"
import { studentApi } from "../../api/studentApi"
import { Link, useSearchParams } from "react-router-dom"
import { CalendarFilled, CalendarOutlined, EnvironmentFilled, EnvironmentOutlined, PlusOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons"
import StudentModal from "./StudentModal"
import StudentAction from "./StudentAction"
import { CatchError } from "../common/catch.error"

const { Text } = Typography
const StudentList = () => {
  const [students, setStudents] = useState<StudentDB[]>([])
  const [studentId, setStudentId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false) // open modal
  const [editing, setEditing] = useState<StudentDB | null>(null)
  // const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchParam, setSearchParam] = useSearchParams()
  const currentPage = Number(searchParam.get('page')) || 1

  const fetchStudents = async (keyword: string) => {
    setLoading(true)
    try {
      const res = await studentApi.findMany(keyword, filterStatus)
      setStudents(res.data)
    } catch (error: any) {
      CatchError.HandleError(error)
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents('')
  }, [filterStatus])

  const columns = [
    { // mã học viên
      title: 'Mã HV', dataIndex: 'MaHocVien',
      key: 'MaHocVien', width: 120, align: 'center' as const,
      render: (code: string) => <Text code>{code}</Text>
    },
    { // tên học viên
      title: 'Họ và tên', dataIndex: 'TenHocVien', //width: 220,
      key: 'TenHocVien', ellipsis: true,
      render: (name: string, student: StudentDB) =>
        <Link to={`/admin/students/${student.ID}`}
          style={{ fontWeight: 'bold' }}>
          <UserOutlined style={{ color: '#8c8c8c' }} /> {name}
        </Link>
    },
    { // ngày sinh
      title: 'Ngày sinh', dataIndex: 'NgaySinh', key: 'NgaySinh', //width: 100,
      render: (dob: string) => <Text>
        <CalendarOutlined style={{ color: '#8c8c8c' }} /> {new Date(dob).toLocaleDateString()}
      </Text>
    },
    { // địa chỉ
      title: 'Địa chỉ', dataIndex: 'DiaChi', key: 'DiaChi', ellipsis: true,
      render: (address: string) => <Space>
        <EnvironmentOutlined style={{ color: '#8c8c8c' }} />
        {!address || '' ? '_' : address}
      </Space>
    },
    { // trạng thái
      title: 'Trạng thái', dataIndex: 'TrangThai', key: 'TrangThai', //width: 160,
      render: (value: string) => {
        const statusMap: Record<string, { color: string, text: string }> = {
          ACTIVE: { color: 'success', text: 'Đang hoạt động' },
          INACTIVE: { color: 'error', text: 'Ngừng hoạt động' }
        }
        // value là 1 trong 3 key đó
        const status = statusMap[value]
        return <Badge status={status.color as any} text={status.text} />
      }
    },
    {// thao tác
      title: 'Thao tác', key: 'action', align: 'center' as const, //width: 150,
      render: (value: StudentDB) =>
        <StudentAction
          student={value}
          onEdit={OpenModalEdit}
          onReload={fetchStudents}
        />
    }
  ]

  const handleOnSave = (studentId: number) => {
    setStudentId(studentId)
    fetchStudents('')
    setTimeout(() => {
      setStudentId(null)
    }, 3000)
  }

  const OpenModalAdd = () => {
    setEditing(null)
    setIsOpen(true)
  }

  const OpenModalEdit = (student: StudentDB) => {
    setEditing(student)
    setIsOpen(true)
  }

  const handleChangePage = (pagination: any) => {
    setSearchParam({ page: pagination.current })
  }

  return (
    <div style={{ padding: 10, background: '#f5f5f5', minHeight: '90vh' }}>
      <Card title={`Danh sách học viên (${students.length})`}
        styles={{
          header: { backgroundColor: '#e6f4ff', color: '#0958d9' }
        }}
      >
        {/* ô tìm kiếm và bộ lọc */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={6}>
            <Input.Search // ô tìm kiếm
              placeholder='Tìm theo tên hoặc mã...'
              prefix={<SearchOutlined />}
              allowClear
              //onChange={(e) => setSearchText(e.target.value)}
              onSearch={fetchStudents}
            />
          </Col>

          <Col span={4}>
            <Select // bộ lọc
              placeholder='Trạng thái'
              style={{ width: '100%' }}
              allowClear
              onChange={(e) => setFilterStatus(e)}
              options={[
                { label: 'Đang hoạt động', value: 'ACTIVE' },
                { label: 'Ngừng hoạt động', value: 'INACTIVE' },
              ]}
            >
            </Select>
          </Col>
          <Col style={{ marginLeft: 'auto' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={OpenModalAdd}
            > Thêm học viên
            </Button>
          </Col>
        </Row>
        {/* Bảng hiển thị dữ liệu */}
        <Table
          dataSource={students}
          columns={columns}
          loading={loading}
          rowClassName={
            (record) => {
              return record.ID === studentId ? 'highlight-row' : ''
            }
          }
          //pagination={{ defaultPageSize: 10 }}
          pagination={{
            current: currentPage,
            pageSize: 10
          }}
          onChange={handleChangePage}
          rowKey="ID"
          scroll={{ x: 1100, y: 408 }}
        />

        {/* Hiển thị Modal UI */}
        <StudentModal
          open={isOpen}
          onCancel={() => setIsOpen(false)}
          onSave={handleOnSave}
          editing={editing!}
        />
      </Card>
    </div>
  )
}

export default StudentList