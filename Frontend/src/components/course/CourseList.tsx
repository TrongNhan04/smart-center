import { useEffect, useState } from 'react';
import { Badge, Button, Card, Col, Input, message, Row, Select, Space, Table, Tag, Typography } from 'antd';
import AddCourseModal from './CourseModal';
import { listCoureApi } from '../../api/courseApi';
import { ClockCircleOutlined, DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';

interface CourseList {
  ID: number,
  MaKhoaHoc: string,
  TenKhoaHoc: string,
  TrinhDo: string,
  HocPhi: number,
  ThoiGian: number,
  TongSoBuoi: number,
  TrangThai: string,
  MoTa?: string,
}

const CourseList = () => {
  // lấy dữ liệu từ api
  const [courses, setCourses] = useState<CourseList[]>([])
  const [courseId, setCourseId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false);

  const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  const fetchCourses = async () => {
    setLoading(true)
    try {

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

  const handelRefresh = (id: number) => {
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
      title: 'Tên khóa học', dataIndex: 'TenKhoaHoc',
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
      render: (month: number, course: CourseList) => (
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
    {
      title: 'Hành động', key: 'action', align: 'center' as const,
      render: (data: CourseList) => (
        <Space size="middle">
          <Button icon={<EditOutlined/>}></Button>
          <Button icon={<DeleteOutlined/>} danger></Button>
        </Space>
      )
    }
  ]

  return (
    <>
      <Card title="Danh sách khóa học"
        extra={<Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsOpen(true)}
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
        <Table <CourseList>
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
        />

        {/* Hiển thị Modal UI */}
        <AddCourseModal
          open={isOpen}
          onCancel={() => setIsOpen(false)}
          onRefresh={handelRefresh}
        />
      </Card>
    </>
  );
};

export default CourseList