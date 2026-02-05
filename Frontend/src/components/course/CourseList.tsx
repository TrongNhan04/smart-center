import { useEffect, useState } from 'react';
import {
  Badge, Button, Card, Col, Input, message, Row, Select,
  Space, Table, Tag, Typography
} from 'antd';
import AddCourseModal from './CourseModal';
import { deleteCourseApi, listCoureApi, updateCourseApi } from '../../api/courseApi';
import { ClockCircleOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import CourseAction from './CourseAction';
import type { CourseType } from './CourseInterface';

const CourseType = () => {
  const [courses, setCourses] = useState<CourseType[]>([])
  const [courseId, setCourseId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)// mở modal

  const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  //lưu dòng dữ liệu đang được sửa
  const [editCourse, setEditCourse] = useState<CourseType | null>()

  const fetchCourses = async () => {
    setLoading(true)
    try {
      // lấy dữ liệu từ API
      const res = await listCoureApi()
      setCourses(res.data)
    }
    catch (error) {
      message.error("Lỗi tải danh sách khóa học")
      console.log(error)
    }
    finally {
      setLoading(false)
    }
  }

  const handelSaveModal = (id: number) => {
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
    setEditCourse(null)
    setIsOpen(true)
  }

  const handleModalEdit = (value: CourseType) => {
    setEditCourse(value)
    setIsOpen(true)
  }

  const handleSoftDelete = async (id: number) => {
    try {
      const res = await deleteCourseApi(id)
      console.log(res.data)
      fetchCourses()
      message.success('Xóa thành công!')
    } catch (error) {
      console.log("Có lỗi xảy ra", error)
    }
  }

  const handleRestore = async (course: CourseType) => {
    try {
      const res = await updateCourseApi(course)
      console.log(res.data)
      fetchCourses()
      message.success('Khôi phục thành công!')
    } catch (error) {
      console.log("Có lỗi xảy ra", error)
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
      render: (name: string) => <Text strong style={{ color: '#1890ff' }}>{name}</Text>
    },
    {
      title: 'Trình độ', dataIndex: 'TrinhDo', key: 'TrinhDo', width: 100,
      render: (level: string) => {
        const levelMap = {
          BEGINER: { color: 'cyan', text: 'Cơ bản' },
          INTERMEDIATE: { color: 'geekblue', text: 'Trung cấp' },
          ADVANCED: { color: 'gold', text: 'Nâng cao' }
        };

        type levelKey = 'BEGINER' | 'INTERMEDIATE' | 'ADVANCED'
        // value là 1 trong 3 key đó
        const status = levelMap[level as levelKey] || { color: 'default', text: level }
        return <Tag color={status.color}>{status.text}</Tag>;
      }
    },
    {
      title: 'Học phí', dataIndex: 'HocPhi', key: 'HocPhi', width: 120,
      align: 'right' as const,
      render: (fee: number) => {
        if (!fee) return <Text strong>0đ</Text>
        const amount = Number(fee)
        return (<Space>
          <Text strong>{amount.toLocaleString('vi-VN')}đ</Text>
        </Space>)
      }
    },
    {
      title: 'Thời gian', dataIndex: 'ThoiGian', key: 'ThoiGian', width: 170,
      render: (month: number, course: CourseType) => (
        <Space>
          <Text><ClockCircleOutlined /> {month} tháng</Text>
          <Text>({course.TongSoBuoi} buổi)</Text>
        </Space>
      )
    },
    {
      title: 'Trạng thái', dataIndex: 'TrangThai', key: 'TrangThai', width: 160,
      render: (value: string) => {
        const statusMap = {
          DRAFT: { color: 'default', text: 'Chưa mở lớp' },
          ACTIVE: { color: 'success', text: 'Đang hoạt động' },
          INACTIVE: { color: 'error', text: 'Đã đóng' }
        };

        type StatusKey = 'DRAFT' | 'ACTIVE' | 'INACTIVE'
        const status = statusMap[value as StatusKey]// value là 1 trong 3 key đó
        //return <Tag color={status.color}>{status.text}</Tag>
        return <Badge status={status.color as any} text={status.text} />;
      }
    },
    {//data: CourseType
      title: 'Hành động', key: 'action', align: 'center' as const, width: 150,
      render: (course: any) => (
        <CourseAction course={course}
          onSoftDelete={(id) => handleSoftDelete(id)}
          onRestore={() => handleRestore(course)}
          onEdit={() => handleModalEdit(course)}
        />
      )
    }
  ]

  return (
    <>
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
        <Table <CourseType>
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
          scroll={{ x: 1100, y: 426 }}
        />

        {/* Hiển thị Modal UI */}
        <AddCourseModal
          open={isOpen}
          onCancel={() => { setEditCourse(null); setIsOpen(false) }}
          onSave={handelSaveModal}
          editCourse={editCourse!}
        />
      </Card>
    </>
  )
}

export default CourseType