import {
  CalendarOutlined, EnvironmentOutlined, InfoCircleOutlined, PhoneOutlined,
  SearchOutlined, UserOutlined
} from "@ant-design/icons"
import { Button, Col, Input, Row, Space, Table, Tooltip, Typography } from "antd"
import { useEffect, useState } from "react"
import type { StuOfClass } from "./ClassDTO"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import classApi from "../../api/classApi"
import { CatchError } from "../common/catch.error"
import { useAuthStore } from "../../store/useAuthStore"

const { Text } = Typography
interface Props {
  id: number
}

const TabStudent = ({ id }: Props) => {
  const [students, setStudents] = useState<StuOfClass[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const navigate = useNavigate()
  const isAmin = useAuthStore(state => state.user?.role) === 'ADMIN'
  const [searchParam, setSearchParam] = useSearchParams()
  const currentPage = Number(searchParam.get('page')) || 1
  const currentTab = searchParam.get('tab') || 'students'
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

  // const filteredData = students.filter(stu => {
  //   const keyword = searchText.toLowerCase()
  //   const matchesKeyword =
  //     stu.MaHocVien.toLowerCase().includes(keyword) ||
  //     stu.TenHocVien.toLowerCase().includes(keyword)
  //   return matchesKeyword
  // })

  const columns = [
    { // mã học viên
      title: 'Mã học viên', dataIndex: 'MaHocVien',
      key: 'MaHocVien', width: 120, align: 'center' as const,
      render: (code: string) => <Text code>{code}</Text>
    },
    { // tên học viên
      title: 'Tên học viên', dataIndex: 'TenHocVien', //width: 220,
      key: 'TenHocVien', ellipsis: true,
      render: (name: string, student: StuOfClass) => {
        return isAmin ? <><UserOutlined style={{ color: '#8c8c8c' }} />
          <Link to={`/admin/students/${student.HocVienID}`}
            style={{ fontWeight: 'bold' }}> {name}</Link></>
          : <Text strong style={{ color: '#1890ff' }}> {name}</Text>
      }
    },
    { // ngày sinh
      title: 'Ngày sinh', dataIndex: 'NgaySinh', key: 'NgaySinh', //width: 100,
      render: (dob: string) => <Text>
        <CalendarOutlined style={{ color: '#8c8c8c' }} /> {new Date(dob).toLocaleDateString()}
      </Text>
    },
    { // địa chỉ
      title: 'Địa chỉ', dataIndex: 'DiaChi', key: 'DiaChi', ellipsis: true,
      render: (address: string) => <Text>
        <EnvironmentOutlined style={{ color: '#8c8c8c' }} /> {address ?? '_'}
      </Text>
    },
    { // ngày nhập học
      title: 'Ngày nhập học', dataIndex: 'NgayNhapHoc', key: 'NgayNhapHoc', //width: 100,
      render: (dob: string) => <Text>
        <CalendarOutlined style={{ color: '#8c8c8c' }} /> {new Date(dob).toLocaleDateString()}
      </Text>
    },
    { // Phụ huynh
      title: 'Phụ huynh', dataIndex: 'PhuHuynh', key: 'PhuHuynh', //width: 100,
      render: (parent: string, stu: StuOfClass) =>
        <Tooltip title={`PH. ${parent}`}>
          <Space style={{ cursor: 'pointer' }}>
            <PhoneOutlined style={{ color: '#8c8c8c' }} />{stu.DienThoai}
          </Space>
        </Tooltip>
    },
    { // thao tác của giáo viên
      title: 'Thao tác', key: 'ThaoTac', align: 'center' as const,
      render: (_: any, stu: StuOfClass) => <Tooltip title='Xem tiến độ'>
        <Button
          icon={<InfoCircleOutlined />}
          type="link"
          size="small"
          onClick={() => navigate(`students/${stu.HocVienID}`)}>
        </Button>
      </Tooltip>
    }
  ]

  const filterColumns = isAmin ?
    columns.filter(item => item.key !== 'ThaoTac')
    : columns.filter(item => item.key !== 'HocPhi')

  return (
    <div>{/* ô tìm kiếm và bộ lọc */}
      {/* <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Input.Search // ô tìm kiếm
            placeholder='Tìm theo tên hoặc mã...'
            prefix={<SearchOutlined />}
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={fetchStuOfClass}
          />
        </Col>
      </Row> */}
      {/* Bảng hiển thị dữ liệu */}
      <Table
        onChange={(page: any) => setSearchParam({
          tab: currentTab,
          page: page.current
        })}
        dataSource={students}
        columns={filterColumns}
        loading={loading}
        pagination={{
          pageSize: 10,
          current: currentPage
        }}
        rowKey="HocVienID"
        scroll={{ x: 1100, y: 408 }}
      />
    </div>
  )
}

export default TabStudent