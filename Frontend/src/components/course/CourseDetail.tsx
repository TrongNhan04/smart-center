import {
  Avatar, Badge, Breadcrumb, Button, Card, Col, Descriptions,
  message, Row, Statistic, Table, Tabs, Tag, Tooltip, Typography
} from "antd"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import type { CourseDB } from "./CourseInterface"
import type { ClassDB } from "../class/ClassInterface"
import courseApi from "../../api/courseApi"
import classApi from "../../api/classApi"
import {
  BookOutlined, CalendarOutlined, ClockCircleOutlined,
  DollarCircleOutlined, EditOutlined, HomeOutlined,
  PlusOutlined, ReadOutlined, UserOutlined
} from "@ant-design/icons"
import CourseModal from "./CourseModal"
import ClassModal from "../class/ClassModal"

const { Title, Text } = Typography

const CourseDetail = () => {
  const { id } = useParams()
  const [course, setCourse] = useState<CourseDB | null>(null)
  const [classes, setClasses] = useState<ClassDB[]>([])
  const [openCourseModal, setOpenCourseModal] = useState(false)
  const [openClassDrawer, setClassDrawer] = useState(false)
  const [classId, setClassId] = useState<number | null>(null)

  const fetchData = async (courseId: number) => {
    try {
      const [courseRes, classesRes] = await Promise.all([
        courseApi.findOne(courseId),
        classApi.getClassesOfCourse(courseId)
      ])
      setCourse(courseRes.data)
      //console.log(courseRes)
      setClasses(classesRes.data)
    }
    catch (error: any) {
      message.error("Có lỗi xảy ra!")
      console.log(error.response.data.message)
    }
  }

  const courseId = Number(id)

  useEffect(() => {
    fetchData(courseId)
  }, [id])

  const handleSaveModal = (id: number) => {
    setClassId(id)
    fetchData(courseId)
    console.log("id lớp nè", classId)
    setTimeout(() => {
      setClassId(null)
    }, 3000);
  }

  if (!course) return <div>Không tìm thấy khóa học</div>

  const levelColor: Record<string, { color: string, text: string }> = {
    BEGINER: { color: 'green', text: 'Sơ cấp' },
    INTERMEDIATE: { color: 'geekblue', text: 'Trung cấp' },
    ADVANCED: { color: 'orange', text: 'Nâng cao' }
  }
  const level = levelColor[course.TrinhDo] || { color: 'default', text: course.TrinhDo }

  const statusColor: Record<string, { color: string, text: string }> = {
    DRAFT: { color: 'default', text: 'Chưa mở lớp' },
    ACTIVE: { color: 'success', text: 'Đang hoạt động' },
    INACTIVE: { color: 'error', text: 'Đã đóng' }
  }
  const status = statusColor[course.TrangThai]

  // tính tổng số lớp đang mở
  const openningClass = classes.filter(item => item.TrangThai !== 'CLOSED')
  // tính tổng học viên có ghi danh active của khóa
  const totalStudentOfCourse = classes.reduce((sum, classOfCourse) => {
    return sum + classOfCourse.TongGhiDanh
  }, 0)

  const columns = [
    {
      title: 'Mã lớp', dataIndex: 'MaLopHoc', key: 'MaLopHoc', width: 100,
      render: (code: string) => <Text code>{code}</Text>
    },
    {
      title: 'Tên lớp', dataIndex: 'TenLop', width: 140,
      key: 'TenLop', ellipsis: true,
      render: (name: string) =>
        <Text strong style={{ color: '#1890ff' }}>{name}</Text>
    },
    {
      title: 'Giáo viên', dataIndex: 'GiaoVien',
      key: 'GiaoVien', ellipsis: true
    },
    {
      title: 'Khai giảng', dataIndex: 'TuNgay', key: 'TuNgay', width: 130,
      render: (day: string) =>
        <Text><CalendarOutlined /> {new Date(day).toLocaleDateString()}</Text>
    },
    {
      title: 'Lịch học', dataIndex: 'LichHoc', key: 'LichHoc',
      render: (schedule: number[], lophoc: ClassDB) => {
        const dow = ['CN',
          'T2', 'T3', 'T4',
          'T5', 'T6', 'T7',
        ]
        const kq = schedule.map(m => dow[m])
        return kq.join('-') + ` (${lophoc.GioHoc})`
      }
    },
    {
      title: 'Sĩ số', dataIndex: 'SiSo', key: 'SiSo', width: 70,
      render: (value: number, lh: ClassDB) => `${lh.TongGhiDanh}/${value}`
    },
    {
      title: 'Trạng thái', dataIndex: 'TrangThai', key: 'TrangThai', width: 100,
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
  ]

  return (
    // div này bọc toàn bộ nội dung trang chi tiết
    <div style={{ minHeight: 'calc(100vh - 64px)', background: '#f0f2f5' }}>
      {/* Phần HEADER */}
      <div style={{ background: '#fff', padding: '16px 24px', borderBlock: '1px solid #e8e8e8' }}>
        {/* Thanh bánh mì */}
        <Breadcrumb items={[
          { title: <Link to='/admin/home'><HomeOutlined /></Link> },
          { title: <Link to='/admin/courses'>Khóa học</Link> },
          { title: `${course.TenKhoaHoc}` }
        ]} />

        {/* Tiêu đề và thông tin chính */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginTop: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar shape="square" size={49}
              style={{ background: `#0d6efd` }}
            >
              {course.MaKhoaHoc}
            </Avatar>

            <div>
              <Title level={3} style={{ margin: 0 }}>
                {course.TenKhoaHoc.toLocaleUpperCase()}
                <Tag color={status.color}
                  style={{ marginLeft: 10, verticalAlign: 'middle' }}>
                  {course.TrangThai}</Tag>
              </Title>

              <Text type="secondary">Mã: {course.MaKhoaHoc}</Text>
            </div>
          </div>
          <Tooltip title='Sửa khóa học'>
            <Button type="primary" ghost icon={<EditOutlined />}
              onClick={() => { setOpenCourseModal(true) }}
            />
          </Tooltip>
        </div>
        <CourseModal
          open={openCourseModal}
          onCancel={() => { setOpenCourseModal(false) }}
          onSave={fetchData}
          editingCourse={course}
        />
      </div>{/*  div của header */}

      {/* div của body */}
      <div style={{ padding: '24px' }}>
        <Row gutter={24}>
          {/* cột trái chứa thông tin chi tiết */}
          <Col span={19}>
            <Card>
              <Tabs
                defaultActiveKey="1"
                tabBarExtraContent={
                  <Button type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => setClassDrawer(true)}
                  >Mở lớp mới
                  </Button>}
                items={[
                  {
                    key: '1',
                    label: 'Danh sách lớp học',
                    children: (

                      <Table <ClassDB> style={{ marginTop: 8 }}
                        dataSource={classes}
                        columns={columns}
                        pagination={{ defaultPageSize: 5 }}
                        rowKey="ID"
                        scroll={{ y: 290 }}
                        rowClassName={
                          (record) => {
                            return record.ID === classId ? 'highlight-row' : ''
                          }
                        }
                      />
                    ),
                  },
                  {
                    key: '2',
                    label: 'Nội dung mô tả',
                    children: (
                      <Typography.Paragraph>
                        &nbsp;&nbsp;&nbsp;&nbsp;{course.MoTa}
                      </Typography.Paragraph>
                    ),
                  }
                ]} /> {/* kết thúc tab */}
            </Card>
            <ClassModal
              open={openClassDrawer}
              onClose={() => setClassDrawer(false)}
              khoahocId={Number(id)}
              onSave={handleSaveModal} />
          </Col>

          {/* Cột phải phụ chứa thông tin tổng quan */}
          <Col span={5}>
            {/* thông tin tổng quan  */}
            <Card title="Thông tin chung" style={{ marginBottom: 24 }}>
              <Descriptions column={1} size='small' colon={false} layout="horizontal" items={[
                {
                  label: <><span style={{ color: '#888' }}>
                    <DollarCircleOutlined /> Học phí: &nbsp; </span>
                    <Text strong>{Number(course.HocPhi).toLocaleString('vi-VN')} đ</Text></>
                },
                {
                  label: <span style={{ color: '#888' }}><BookOutlined /> Trình độ: &nbsp;
                    <Tag color={level.color}>{level.text.toLocaleUpperCase()}</Tag></span>
                },
                {
                  label: <span style={{ color: '#888' }}><ClockCircleOutlined /> Thời lượng: &nbsp;
                    <Text strong>{course.ThoiGian} tháng </Text>({course.TongSoBuoi} buổi)
                  </span>
                }
              ]}>
              </Descriptions>
            </Card>

            {/* thống kê nhanh */}
            <Card>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Lớp đang mở"
                    value={openningClass.length}
                    prefix={<ReadOutlined />}
                  />
                </Col>

                <Col span={12}>
                  <Statistic
                    title="Tổng học viên"
                    value={totalStudentOfCourse}
                    prefix={<UserOutlined />}
                  // valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default CourseDetail