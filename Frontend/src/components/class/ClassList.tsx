import { CalendarOutlined, ClockCircleOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Badge,
  Button, Card, Col, Input, message,
  Progress,
  Row, Select, Space, Table,
  Typography
} from "antd";
import type { ClassDB } from "./ClassDTO";
import { useEffect, useState } from "react";
import classApi from "../../api/classApi";
import ClassModal from "./ClassModal";
import ClassAction from "./ClassAction";
import { Link } from "react-router-dom";
const { Text } = Typography

const ClassList = () => {
  const [classes, setClasses] = useState<ClassDB[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [openClassModal, setOpenClassModal] = useState(false)
  const [classId, setClassId] = useState<number | null>(null)
  const [editingClass, setEditingClass] = useState<ClassDB | null>(null)

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const res = await classApi.findMany()
      setClasses(res.data)
      // console.log("data fetch", res.data)
    } catch (error) {
      message.error("Có lỗi xảy ra!")
      console.log("Có lỗi hàm fetchClasses: ", error)
    }
    finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchClasses()
  }, [])

  const filteredData = classes.filter(item => {
    const lowerCase = searchText.toLocaleLowerCase()
    const matchesKeyword =
      item.TenLop.toLocaleLowerCase().includes(lowerCase) ||
      item.MaLopHoc.toLocaleLowerCase().includes(lowerCase) ||
      item.GiaoVien.HoTen.toLocaleLowerCase().includes(lowerCase)
    const matchesStatus = filterStatus ? item.TrangThai === filterStatus : true
    return matchesKeyword && matchesStatus
  })

  const OpenModalAdd = () => {
    setEditingClass(null)
    setOpenClassModal(true)
  }

  const handleSaveModal = (id: number) => {
    setClassId(id)
    fetchClasses()
    setTimeout(() => {
      setClassId(null)
    }, 3000);
  }

  const handleSoftDelete = async (id: number) => {
    try {
      await classApi.detele(id)
      fetchClasses()
      message.success('Thao tác thành công')
    } catch (error) {
      message.error("Có lỗi xảy ra!")
      console.log('Có lỗi xảy ra', error)
    }
  }

  const OpenModalEdit = (lophoc: ClassDB) => {
    setEditingClass(lophoc)
    setOpenClassModal(true)
  }

  const columns = [
    {// mã lớp+tên lớp chung
      title: 'Lớp học', dataIndex: 'MaLopHoc', key: 'MaLopHoc', ellipsis: true,
      render: (code: string, lophoc: ClassDB) => (
        <Space orientation="vertical">
          <Link to={`/admin/classes/${lophoc.ID}`}
            style={{ fontWeight: 'bold' }}>
            {lophoc.TenLop}</Link>
          <Text code style={{ fontSize: 14 }}>{code}</Text>
        </Space>
      )
    },
    { // khóa học 
      title: 'Khóa học', dataIndex: ['KhoaHoc', 'TenKhoaHoc'],
      key: 'TenKhoaHoc', ellipsis: true,
      render: (name: string, lophoc: ClassDB) =>
        <Link to={`/admin/courses/${lophoc.KhoaHoc.ID}`}>{name}</Link>
    },
    { // giáo viên
      title: 'Giáo viên', dataIndex: ['GiaoVien', 'HoTen'],
      key: 'HoTen', ellipsis: true,
      render: (name: string, lophoc: ClassDB) => 
        <Link to={`/admin/teachers/${lophoc.GiaoVien.ID}`}>{name}</Link>
    },
    { // khai giảng = ngày bắt đầu
      title: 'Khai giảng', dataIndex: 'TuNgay', key: 'TuNgay', width: 130,
      render: (day: string) =>
        <Text><CalendarOutlined /> {new Date(day).toLocaleDateString()}</Text>
    },
    { // lịch học
      title: 'Lịch học', dataIndex: 'LichHoc', key: 'LichHoc',
      render: (schedule: number[], lophoc: ClassDB) => {
        const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
        const result = schedule.map(m => dow[m]).join('-')

        {/* orientation="vertical" giúp xếp chồng lên nhau */ }
        return <Space orientation="vertical" size={0}>
          <Text strong><ClockCircleOutlined /> {lophoc.GioHoc}</Text>

          <Text type="secondary" style={{ fontSize: '14px', display: 'block', textAlign: 'center' }}>
            {result}
          </Text>
        </Space>
      }
    },
    { // sĩ số
      title: 'Sĩ số', dataIndex: 'SiSo', key: 'SiSo',
      render: (classSize: number, lophoc: ClassDB) => (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{lophoc.TongGhiDanh}/{classSize}</span>
            <small style={{ color: '#999' }}>HV</small>
          </div>
          <Progress
            percent={(lophoc.TongGhiDanh / classSize) * 100}
            showInfo={false}
          />
        </>
      )
    },
    { // trạng thái
      title: 'Trạng thái', dataIndex: 'TrangThai', key: 'TrangThai',
      render: (value: string) => {
        const statusMap: Record<string, { color: string, text: string }> = {
          OPEN: { color: 'default', text: 'Tuyển sinh' },
          RUNNING: { color: 'success', text: 'Đang hoạt động' },
          CLOSED: { color: 'error', text: 'Đã đóng' }
        }
        // value là 1 trong 3 key đó
        const status = statusMap[value]
        return <Badge status={status.color as any} text={status.text} />
      }
    },
    {// thao tác
      title: 'Thao tác', key: 'action', align: 'center' as const,
      render: (value: ClassDB) => <ClassAction
        lophoc={value}
        onSoftDelete={handleSoftDelete}
        onEdit={OpenModalEdit}
      />
    }
  ]

  return (
    <Card title={`Danh sách lớp học (${classes.length})`}>
      {/* ô tìm kiếm và bộ lọc */}
      <Row gutter={16} style={{ marginBottom: 18 }}>
        <Col span={6}>
          <Input
            placeholder='Tìm theo tên hoặc mã...'
            prefix={<SearchOutlined />}
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>

        <Col span={3}>
          <Select
            placeholder='Trạng thái'
            style={{ width: '100%' }}
            allowClear
            onChange={(e) => setFilterStatus(e)}
            options={[
              { label: 'Tuyển sinh', value: 'OPEN' },
              { label: 'Đang hoạt động', value: 'RUNNING' },
              { label: 'Đã đóng', value: 'CLOSED' },
            ]}
          >
          </Select>
        </Col>
        <Col style={{ marginLeft: 'auto' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={OpenModalAdd}
          >
            Thêm lớp học
          </Button>
        </Col>
      </Row>
      {/* Bảng hiển thị dữ liệu */}
      <Table <ClassDB>
        dataSource={filteredData}
        columns={columns}
        loading={loading}
        rowClassName={
          (lophoc) => {
            return lophoc.ID === classId ? 'highlight-row' : ''
          }
        }
        pagination={{ defaultPageSize: 8 }}
        rowKey="ID"
        scroll={{ x: 1000, y: 430 }}
      />

      {/* Hiển thị Modal UI */}
      <ClassModal
        open={openClassModal}
        onCancel={() => setOpenClassModal(false)}
        khoahocId={null}
        onSave={handleSaveModal}
        editingClass={editingClass!}
      />
    </Card>
  )
}

export default ClassList