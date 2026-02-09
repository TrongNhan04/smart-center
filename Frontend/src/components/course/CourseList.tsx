import { useEffect, useState } from 'react';
import {
  Badge, Button, Card, Col, Input, message, Row, Select,
  Space, Table, Tag, Typography
} from 'antd';
import courseApi, { } from '../../api/courseApi';
import { ClockCircleOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import CourseAction from './CourseAction';
import { mapRecordToForm, type CourseDB } from './CourseInterface';
import CourseModal from './CourseModal';
import { Link } from 'react-router-dom';

const CourseList = () => {
  const [courses, setCourses] = useState<CourseDB[]>([])
  const [courseId, setCourseId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)// mở modal

  const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  const [editingCourse, setEditingCourse] = useState<CourseDB | null>(null)
  const fetchCourses = async () => {
    setLoading(true)
    try {
      // lấy dữ liệu từ API
      const res = await courseApi.findMany()
      setCourses(res.data)
    }
    catch (error: any) {
      message.error("Lỗi tải danh sách khóa học")
      console.log(error.response.data.message)
    }
    finally {
      setLoading(false)
    }
  }

  const handleSaveModal = (id: number) => {
    setCourseId(id)
    fetchCourses()
    setTimeout(() => {
      setCourseId(null)
    }, 3000);
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const filteredData = courses.filter(item => {
    const matchesKeyword = item.TenKhoaHoc.toLocaleLowerCase()
      .includes(searchText.toLocaleLowerCase()) ||
      item.MaKhoaHoc.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())

    const matchesStatus = filterStatus ? item.TrangThai === filterStatus : true
    return matchesKeyword && matchesStatus
  })

  const handleModalAdd = () => {
    setEditingCourse(null)
    setIsOpen(true)
  }

  const handleModalEdit = (course: CourseDB) => {
    setEditingCourse(course)
    setIsOpen(true)
  }

  const handleRestore = async (course: CourseDB) => {
    try {
      const formData = mapRecordToForm(course)
      await courseApi.update(course.ID, formData)
      fetchCourses()
      message.success('Khôi phục thành công')
      // handleSaveModal(course.ID)
    } catch (error: any) {
      console.log("Có lỗi xảy ra", error.response.data.message)
    }
  }

  const handleSoftDelete = async (id: number) => {
    try {
      await courseApi.delete(id)
      fetchCourses()
      message.success('Thao tác thành công')
    } catch (error: any) {
      console.log("Có lỗi xảy ra: ", error.response.data.message)
    }
    finally {
      setLoading(false)
    }
  }

  const { Text } = Typography
  const columns = [
    {
      title: 'ID', dataIndex: 'ID', key: 'ID', width: 60,
      render: (id: number) => <Text type='secondary'>{id}</Text>
    },
    {
      title: 'Mã khóa học', dataIndex: 'MaKhoaHoc', key: 'MaKhoaHoc', width: 120,
      render: (code: string) => <Text code>{code}</Text>
    },
    {
      title: 'Tên khóa học', dataIndex: 'TenKhoaHoc', width: 220,
      key: 'TenKhoaHoc', ellipsis: true,
      render: (name: string, course: CourseDB) =>
        <Link to={`/admin/courses/${course.ID}`}
          style={{ fontWeight: 'bold' }}>{name}</Link>
      // <Text strong style={{ color: '#1890ff' }}>{name}</Text>
    },
    {
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
    {
      title: 'Học phí', dataIndex: 'HocPhi', key: 'HocPhi', width: 120,
      align: 'right' as const,
      render: (fee: number) => {
        if (!fee) return <Text strong>0đ</Text>
        const amount = Number(fee)
        return (<Space>
          <Text strong>{amount.toLocaleString('vi-VN')} đ</Text>
        </Space>)
      }
    },
    {
      title: 'Thời gian', dataIndex: 'ThoiGian', key: 'ThoiGian', width: 170,
      render: (month: number, courses: CourseDB) => (
        <Space>
          <Text><ClockCircleOutlined /> {month} tháng</Text>
          <Text>({courses.TongSoBuoi} buổi)</Text>
        </Space>
      )
    },
    {
      title: 'Trạng thái', dataIndex: 'TrangThai', key: 'TrangThai', width: 160,
      render: (value: string) => {
        const statusMap: Record<string, { color: string, text: string }> = {
          DRAFT: { color: 'default', text: 'Chưa mở lớp' },
          ACTIVE: { color: 'success', text: 'Đang hoạt động' },
          INACTIVE: { color: 'error', text: 'Đã đóng' }
        }
        // value là 1 trong 3 key đó
        const status = statusMap[value]
        //return <Tag color={status.color}>{status.text}</Tag>
        return <Badge status={status.color as any} text={status.text} />
      }
    },
    {//data: CourseDB
      title: 'Thao tác', key: 'action', align: 'center' as const, width: 150,
      render: (course: CourseDB) => (
        <CourseAction
          course={course}
          onRestore={handleRestore}
          onSoftDelete={handleSoftDelete}
          onEdit={handleModalEdit}
        />
      )
    }
  ]

  return (
    <Card title="Danh sách khóa học"
      extra={<Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleModalAdd}
      >
        Thêm khóa học
      </Button>}
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
        pagination={{ defaultPageSize: 7 }}
        rowKey="ID"
        // scroll={{ x: 1100, y: 426 }}
      />

      {/* Hiển thị Modal UI */}
      <CourseModal
        open={isOpen}
        onCancel={() => { setIsOpen(false); setEditingCourse(null) }}
        onSave={handleSaveModal}
        editingCourse={editingCourse!}
      />
    </Card>
  )
}

export default CourseList