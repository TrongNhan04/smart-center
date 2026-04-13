import { useEffect, useState } from 'react';
import {
  Badge, Button, Card, Col, Input, message, notification, Row, Select,
  Space, Table, Tag, Typography
} from 'antd';
import courseApi from '../../api/courseApi';
import { ClockCircleFilled, ClockCircleOutlined, DollarCircleFilled, DollarCircleOutlined, PlusOutlined, ReadOutlined, SearchOutlined } from '@ant-design/icons';
import CourseAction from './CourseAction';
import { type CourseDB } from './CourseDTO';
import CourseModal from './CourseModal';
import { Link, useSearchParams } from 'react-router-dom';
import { CatchError } from '../common/catch.error';
const { Text } = Typography

const CourseList = () => {
  const [courses, setCourses] = useState<CourseDB[]>([])
  const [courseId, setCourseId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)// mở modal
  const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [editingCourse, setEditingCourse] = useState<CourseDB | null>(null)
  const [searchParam, setSearchParam] = useSearchParams()
  const currentPage = Number(searchParam.get('page')) || 1

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const res = await courseApi.findMany()
      setCourses(res.data)
    }
    catch (error: any) {
      CatchError.HandleError(error)
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const handleSaveModal = (id: number) => {
    setCourseId(id)
    fetchCourses()
    setTimeout(() => {
      setCourseId(null)
    }, 3000);
  }

  const filteredData = courses.filter(item => {
    const lowerCase = searchText.toLowerCase()
    const matchesKeyword =
      item.TenKhoaHoc.toLowerCase().includes(lowerCase) ||
      item.MaKhoaHoc.toLowerCase().includes(lowerCase)

    const matchesStatus = filterStatus ? item.TrangThai === filterStatus : true
    return matchesKeyword && matchesStatus
  })

  const OpenModalAdd = () => {
    setEditingCourse(null)
    setIsOpen(true)
  }

  const OpenModalEdit = (course: CourseDB) => {
    setEditingCourse(course)
    setIsOpen(true)
  }

  const handleRestore = async (course: CourseDB) => {
    try {
      await courseApi.restore(course.ID)
      message.success('Khôi phục thành công')
      handleSaveModal(course.ID)
    } catch (error: any) {
      CatchError.HandleError(error)
    }
  }

  const handleSoftDelete = async (id: number) => {
    try {
      await courseApi.delete(id)
      message.success('Thao tác thành công')
      handleSaveModal(id)
    } catch (error: any) {
      CatchError.HandleError(error)
    }
  }

  const handleBack = (pagination: any) =>
    setSearchParam({ page: pagination.current })

  const columns = [
    { // mã khóa học
      title: 'Mã khóa học', dataIndex: 'MaKhoaHoc', key: 'MaKhoaHoc', width: 120,
      render: (code: string) => <Text code>{code}</Text>
    },
    { // tên khóa học
      title: 'Tên khóa học', dataIndex: 'TenKhoaHoc', width: 220,
      key: 'TenKhoaHoc', ellipsis: true,
      render: (name: string, course: CourseDB) => <>
        <ReadOutlined style={{ color: '#8c8c8c' }} />
        <Link to={`/admin/courses/${course.ID}`}
          style={{ fontWeight: 'bold' }}> {name}</Link>
      </>
    },
    { // trình độ
      title: 'Trình độ', dataIndex: 'TrinhDo', key: 'TrinhDo', width: 100,
      render: (level: string) => {
        const levelMap: Record<string, { color: string, text: string }> = {
          BEGINER: { color: 'green', text: 'Cơ bản' },
          INTERMEDIATE: { color: 'geekblue', text: 'Trung cấp' },
          ADVANCED: { color: 'orange', text: 'Nâng cao' }
        }
        // level là 1 trong 3 key đó
        const status = levelMap[level] || { color: 'default', text: level }
        return <Tag color={status.color}>{status.text}</Tag>
      }
    },
    { // học phí
      title: 'Học phí', dataIndex: 'HocPhi', key: 'HocPhi', width: 120,
      align: 'right' as const,
      render: (fee: number) => {
        if (!fee) return <Text strong>0đ</Text>
        const amount = Number(fee)
        return <Text>
          <DollarCircleOutlined style={{ color: '#52c41a' }} /> {amount.toLocaleString()}đ
        </Text>
      }
    },
    { // thời gian
      title: 'Thời gian', dataIndex: 'ThoiGian', key: 'ThoiGian', width: 170,
      render: (month: number, courses: CourseDB) => (
        <Space>
          <Text><ClockCircleOutlined style={{ color: '#1677FF' }} /> {month} tháng</Text>
          <Text>({courses.TongSoBuoi} buổi)</Text>
        </Space>
      )
    },
    { // trạng thái
      title: 'Trạng thái', dataIndex: 'TrangThai', key: 'TrangThai', width: 160,
      render: (value: string) => {
        const statusMap: Record<string, { color: string, text: string }> = {
          DRAFT: { color: 'default', text: 'Chưa mở lớp' },
          ACTIVE: { color: 'success', text: 'Đang hoạt động' },
          INACTIVE: { color: 'error', text: 'Đã đóng' }
        }
        // value là 1 trong 3 key đó
        const status = statusMap[value]
        return <Badge status={status.color as any} text={status.text} />
      }
    },
    {// thao tác
      title: 'Thao tác', key: 'action', align: 'center' as const, width: 150,
      render: (course: CourseDB) => (
        <CourseAction
          course={course}
          onRestore={handleRestore}
          onSoftDelete={handleSoftDelete}
          onEdit={OpenModalEdit}
        />
      )
    }
  ]

  return (
    <div style={{ padding: 10, background: '#f5f5f5', minHeight: '90vh' }}>
      <Card title={`Danh sách khóa học (${courses.length})`}
        styles={{
          header: { backgroundColor: '#e6f4ff', color: '#0958d9' }
        }}
      >
        {/* ô tìm kiếm và bộ lọc */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
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
                { label: 'Chưa mở lớp', value: 'DRAFT' },
                { label: 'Đang hoạt động', value: 'ACTIVE' },
                { label: 'Đã đóng', value: 'INACTIVE' },
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
              Thêm khóa học
            </Button>
          </Col>
        </Row>
        {/* Bảng hiển thị dữ liệu */}
        <Table <CourseDB>
          dataSource={filteredData}
          columns={columns}
          loading={loading}
          rowClassName={
            (record) => {
              return record.ID === courseId ? 'highlight-row' : ''
            }
          }
          // pagination={{ defaultPageSize: 10 }}
          pagination={{
            current: currentPage,
            pageSize: 10
          }}
          onChange={handleBack}
          rowKey="ID"
          scroll={{ x: 1100, y: 408 }}
        />

        {/* Hiển thị Modal UI */}
        <CourseModal
          open={isOpen}
          onCancel={() => { setIsOpen(false); setEditingCourse(null) }}
          onSave={handleSaveModal}
          editingCourse={editingCourse!}
        />
      </Card>
    </div>
  )
}

export default CourseList