import { CalendarFilled, CalendarOutlined, DollarCircleFilled, DollarCircleOutlined, EnvironmentFilled, EnvironmentOutlined, PhoneFilled, PhoneOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons"
import { Col, Input, notification, Row, Space, Table, Tooltip, Typography } from "antd"
import { useEffect, useState } from "react"
import type { StuOfClass } from "./ClassDTO"
import { Link } from "react-router-dom"
import classApi from "../../api/classApi"
import { CatchError } from "../common/catch.error"

const { Text } = Typography

const TabStudent = ({ id }: { id: number }) => {
  const [students, setStudents] = useState<StuOfClass[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const classId = Number(id)
  const fetchStuOfClass = async () => {
    try {
      setLoading(true)
      const res = await classApi.findStudentById(classId)
      setStudents(res.data)
    } catch (error: any) {
      CatchError.HandleError(error)
    }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchStuOfClass()
  }, [])

  const filteredData = students.filter(stu => {
    const keyword = searchText.toLowerCase()
    const matchesKeyword =
      stu.MaHocVien.toLowerCase().includes(keyword) ||
      stu.TenHocVien.toLowerCase().includes(keyword)
    return matchesKeyword
  })

  const columns = [
    { // mã học viên
      title: 'Mã học viên', dataIndex: 'MaHocVien',
      key: 'MaHocVien', width: 120, align: 'center' as const,
      render: (code: string) => <Text code>{code}</Text>
    },
    { // tên học viên
      title: 'Tên học viên', dataIndex: 'TenHocVien', //width: 220,
      key: 'TenHocVien', ellipsis: true,
      render: (name: string, student: StuOfClass) =>
        <Link to={`/admin/students/${student.HocVienID}`}
          style={{ fontWeight: 'bold' }}><UserOutlined/> {name}</Link>
    },
    { // ngày sinh
      title: 'Ngày sinh', dataIndex: 'NgaySinh', key: 'NgaySinh', //width: 100,
      render: (dob: string) => <Text>
        <CalendarOutlined /> {new Date(dob).toLocaleDateString()}
      </Text>
    },
    { // địa chỉ
      title: 'Địa chỉ', dataIndex: 'DiaChi', key: 'DiaChi', ellipsis: true,
      render: (address: string) => <Text>
        <EnvironmentFilled style={{ color: '#ff1818' }} /> {address ?? '_'}
      </Text>
    },
    { // ngày nhập học
      title: 'Ngày nhập học', dataIndex: 'NgayNhapHoc', key: 'NgayNhapHoc', //width: 100,
      render: (dob: string) => <Text>
        <CalendarFilled style={{ color: '#b7b7b1' }} /> {new Date(dob).toLocaleDateString()}
      </Text>
    },
    { // Phụ huynh
      title: 'Phụ huynh', dataIndex: 'PhuHuynh', key: 'PhuHuynh', //width: 100,
      render: (parent: string, stu: StuOfClass) =>
        <Tooltip title={`PH. ${parent}`}>
          <Space style={{ cursor: 'pointer', color: '#1890ff' }}>
            <PhoneFilled />{stu.DienThoai}
          </Space>
        </Tooltip>
    },
    { // học phí
      title: 'Học phí', dataIndex: 'HocPhi', key: 'HocPhi', //width: 100,
      render: (fee: string) => {
        const hocPhi = Number(fee) ?? 0
        return <Text style={{ color: '#47b410' }}>
          <DollarCircleFilled /> {hocPhi.toLocaleString()}</Text>
      }
    },
  ]

  return (
    <div>{/* ô tìm kiếm và bộ lọc */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Input.Search // ô tìm kiếm
            placeholder='Tìm theo tên hoặc mã...'
            prefix={<SearchOutlined />}
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={fetchStuOfClass}
          />
        </Col>

        {/* <Col style={{ marginLeft: 'auto' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={OpenModalAdd}
          > Thêm học viên
          </Button>
        </Col> */}
      </Row>
      {/* Bảng hiển thị dữ liệu */}
      <Table
        dataSource={filteredData}
        columns={columns}
        loading={loading}
        pagination={{ defaultPageSize: 10 }}
        rowKey="HocVienID"
        scroll={{ x: 1100, y: 408 }}
      />
    </div>
  )
}

export default TabStudent