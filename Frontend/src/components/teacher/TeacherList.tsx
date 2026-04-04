import {
  CalendarFilled, MailFilled, PhoneFilled, PlusOutlined, SearchOutlined,
  UserOutlined
} from "@ant-design/icons"
import {
  Badge, Button, Card, Col, Input, notification, Row, Select, Table, Typography
} from "antd"
import type { TeacherDB } from "./TeacherDTO"
import { Link, useSearchParams } from "react-router-dom"
import { useEffect, useState } from "react"
import teacherApi from "../../api/teacherApi"
import TeacherAction from "./TeacherAction"
import TeacherModal from "./TeacherModal"

const { Text } = Typography
const TeacherList = () => {
  const [teachers, setTeachers] = useState<TeacherDB[]>([])
  const [teacherId, setTeacherId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<TeacherDB | null>(null)
  const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [searchParam, setSearchParam] = useSearchParams()
  const currentPage = Number(searchParam.get('page')) || 1

  const fetchTeachers = async () => {
    setLoading(true)
    try {
      const res = await teacherApi.findMany()
      setTeachers(res.data)
    } catch (error: any) {
      notification.error({
        title: 'Có lỗi xảy ra',
        description: error.response.data.message,
        showProgress: true,
        pauseOnHover: true
      })
      console.log('Có lỗi xảy ra: ', error)
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  const filteredData = teachers.filter(item => {
    const lowerCase = searchText.toLowerCase()
    const matchesKeyword = item.HoTen.toLowerCase().includes(lowerCase) ||
      item.MaGiaoVien.toLowerCase().includes(lowerCase)
    const matchesStatus = filterStatus ? item.TrangThai === filterStatus : true
    return matchesKeyword && matchesStatus
  })

  const columns = [
    { // mã giáo viên
      title: 'Mã giáo viên', dataIndex: 'MaGiaoVien',
      key: 'MaGiaoVien', width: 120, align: 'center' as const,
      render: (code: string) => <Text code>{code}</Text>
    },
    { // tên giáo viên
      title: 'Họ và tên', dataIndex: 'HoTen', //width: 220,
      key: 'HoTen', ellipsis: true,
      render: (name: string, teacher: TeacherDB) =>
        <Link to={`/admin/teachers/${teacher.ID}`}
          style={{ fontWeight: 'bold' }}><UserOutlined /> {name}</Link>
    },
    { // ngày sinh
      title: 'Ngày sinh', dataIndex: 'NgaySinh', key: 'NgaySinh', //width: 100,
      render: (dob: string) => <Text>
        <Text><CalendarFilled style={{ color: '#ff7818' }} /> {new Date(dob).toLocaleDateString()}</Text>
      </Text>
    },
    { //Điện thoại
      title: 'Điện thoại', dataIndex: 'DienThoai', key: 'DienThoai', //width: 100,
      render: (phone: string) => <Text>
        <PhoneFilled /> {phone}
      </Text>
    },
    { // Email
      title: 'Email', dataIndex: 'Email', key: 'Email', //width: 120,
      render: (email: string) => <Text>
        {/* <MailOutlined style={{color:'#ff1818'}}/> {email} */}
        <MailFilled style={{ color: '#188fff' }} /> {email}
      </Text>
    },
    { // trạng thái
      title: 'Trạng thái', dataIndex: 'TrangThai', key: 'TrangThai', //width: 160,
      render: (value: string) => {
        const statusMap: Record<string, { color: string, text: string }> = {
          ACTIVE: { color: 'success', text: 'Hoạt động' },
          INACTIVE: { color: 'error', text: 'Ngừng hoạt động' }
        }
        // value là 1 trong 3 key đó
        const status = statusMap[value]
        return <Badge status={status.color as any} text={status.text} />
      }
    },
    {// thao tác
      title: 'Thao tác', key: 'action', align: 'center' as const, //width: 150,
      render: (value: TeacherDB) =>
        <TeacherAction
          teacher={value}
          onReload={handleOnSave}
          onEdit={OpenModalEdit}
        />
    }
  ]

  const handleOnSave = (teacherId: number) => {
    setTeacherId(teacherId)
    fetchTeachers()
    setTimeout(() => {
      setTeacherId(null)
    }, 3000)
  }

  const OpenModalAdd = () => {
    setEditing(null)
    setIsOpen(true)
  }

  const OpenModalEdit = (teacher: TeacherDB) => {
    setEditing(teacher)
    setIsOpen(true)
  }

  const changeTablePage = (pagination: any) =>
    setSearchParam({ page: pagination.current })

  return (
    <div style={{ padding: 10, background: '#f5f5f5', minHeight: '90vh' }}>
      <Card title={`Danh sách giáo viên (${teachers.length})`}
        styles={{
          header: { backgroundColor: '#e6f4ff', color: '#0958d9' }
        }}
      >
        {/* ô tìm kiếm và bộ lọc */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={6}>
            <Input // ô tìm kiếm
              placeholder='Tìm theo tên hoặc mã...'
              prefix={<SearchOutlined />}
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
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
            > Thêm giáo viên
            </Button>
          </Col>
        </Row>
        {/* Bảng hiển thị dữ liệu */}
        <Table //<CourseDB>
          dataSource={filteredData}
          columns={columns}
          loading={loading}
          rowClassName={
            (record) => record.ID === teacherId ? 'highlight-row' : ''
          }
          //pagination={{ defaultPageSize: 10 }}
          pagination={{
            current: currentPage,
            pageSize: 10
          }}
          onChange={changeTablePage}
          rowKey="ID"
          scroll={{ x: 1100, y: 408 }}
        />

        {/* Hiển thị Modal UI */}
        <TeacherModal
          open={isOpen}
          onCancel={() => setIsOpen(false)}
          onSave={handleOnSave}
          editing={editing!}
        />
      </Card>
    </div>
  )
}

export default TeacherList