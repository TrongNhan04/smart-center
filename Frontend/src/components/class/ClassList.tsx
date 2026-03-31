import {
  CalendarOutlined, ClockCircleOutlined, PlusOutlined,
  SearchOutlined
} from "@ant-design/icons";
import {
  Badge, Button, Card, Col, Input, message, Progress, Row, Select,
  Space, Table, Typography
} from "antd";
import type { ClassDB } from "./ClassDTO";
import { useEffect, useState } from "react";
import classApi from "../../api/classApi";
import ClassModal from "./ClassModal";
import ClassAction from "./ClassAction";
import { Link, useSearchParams } from "react-router-dom";
const { Text } = Typography

const ClassList = () => {
  const [classes, setClasses] = useState<ClassDB[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [openClassModal, setOpenClassModal] = useState(false)
  const [classId, setClassId] = useState<number | null>(null)
  const [editingClass, setEditingClass] = useState<ClassDB | null>(null)
  const [searchParam, setSearchParam] = useSearchParams()
  const currentPage = Number(searchParam.get('page')) || 1

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const res = await classApi.findMany()
      setClasses(res.data)
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

  const handleBack = (pagination: any) =>
    setSearchParam({ page: pagination.current })
  //  render: (text, record, index) => index + 1, // index starts from 0
  const columns = [
    {// mã lớp+tên lớp chung
      title: 'Lớp học', dataIndex: 'MaLopHoc', key: 'MaLopHoc ', ellipsis: true,
      render: (code: string, lophoc: ClassDB) => (
        <Space orientation="vertical">
          <Link to={`/admin/classes/${lophoc.ID}`}
            style={{ fontWeight: 'bold' }}>
            {lophoc.TenLop}</Link>
          <Text code style={{ fontSize: 14 }}>{code}</Text>
        </Space>
      )
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
            <small style={{ color: '#999' }}>Học viên</small>
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
      filters: [
        { text: 'Tuyển sinh', value: 'OPEN' },
        { text: 'Đang hoạt động', value: 'RUNNING' },
        { text: 'Đã đóng', value: 'CLOSED' },
        { text: 'Đã kết thúc', value: 'FINISHED' }
      ],
      onFilter: (value: any, lophoc: ClassDB) => lophoc.TrangThai === value,
      render: (value: string) => {
        const statusMap: Record<string, { color: string, text: string }> = {
          OPEN: { color: 'default', text: 'Tuyển sinh' },
          RUNNING: { color: 'processing', text: 'Đang hoạt động' },
          CLOSED: { color: 'error', text: 'Đã đóng' },
          FINISHED: { color: 'success', text: 'Đã kết thúc' }
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
    <div style={{ padding: 10, background: '#f5f5f5', minHeight: '90vh' }}>
      <Card title={`Danh sách lớp học (${classes.length})`}
        styles={{
          header: { backgroundColor: '#e6f4ff', color: '#0958d9' }
        }}
      >
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

          <Col span={4}>
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
            (lophoc) =>
              lophoc.ID === classId ? 'highlight-row' : ''
          }
          // pagination={{ defaultPageSize: 8 }}
          pagination={{
            current: currentPage,
            pageSize: 10
          }}
          onChange={handleBack}
          rowKey="ID"
          scroll={{ x: 1000, y: 410 }}
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
    </div>
  )
}

export default ClassList