import {
  Avatar, Badge, Button, Card, Progress, Skeleton, Space, Table, Tabs, Tag,
  Tooltip, Typography
} from "antd"
import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import type { CourseDB } from "./CourseDTO"
import type { ClassDB } from "../class/ClassDTO"
import courseApi from "../../api/courseApi"
import classApi from "../../api/classApi"
import {
  CalendarOutlined, ClockCircleOutlined, EditOutlined, LeftOutlined, PlusOutlined, ReadOutlined,
  UserOutlined,
} from "@ant-design/icons"
import CourseModal from "./CourseModal"
import ClassModal from "../class/ClassModal"
import { CatchError } from "../common/catch.error"
import TabInfo from "./TabInfo"

const { Title, Text } = Typography

const CourseDetail = () => {
  const { id } = useParams()
  const courseId = Number(id)
  const [course, setCourse] = useState<CourseDB | null>(null)
  const [classes, setClasses] = useState<ClassDB[]>([])
  const [openCourseModal, setOpenCourseModal] = useState(false)
  const [openClassModal, setOpenClassModal] = useState(false)
  const [classId, setClassId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const initData = async () => {
    try {
      setLoading(true)
      const [courseRes, classRes] = await Promise.all([
        courseApi.findOne(courseId),
        classApi.getByCourseId(courseId)
      ])
      setCourse(courseRes.data)
      setClasses(classRes.data)
    } catch (error: any) {
      CatchError.HandleError(error)
    }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!courseId) {
      setLoading(false)
      return
    }
    initData()
  }, [courseId])

  const SaveClassModal = (id: number) => {
    setClassId(id)
    initData()
    setTimeout(() => {
      setClassId(null)
    }, 3000);
  }

  const statusColor: Record<string, { color: string, text: string }> = {
    DRAFT: { color: 'default', text: 'Chưa mở lớp' },
    ACTIVE: { color: 'success', text: 'Đang hoạt động' },
    INACTIVE: { color: 'error', text: 'Đã đóng' }
  }
  const status = course ? statusColor[course.TrangThai] : { color: 'default', text: '' }

  // tính tổng học viên có ghi danh active của khóa
  const totalStudent = classes.reduce((sum, classOfCourse) => {
    return sum + classOfCourse.TongGhiDanh
  }, 0)

  const columns = [
    {// mã lớp 
      title: 'Mã lớp', dataIndex: 'MaLopHoc', key: 'MaLopHoc', width: 120,
      align: 'center' as const, render: (code: string) =>
        <Text code style={{ fontSize: 14 }}>{code}</Text>
    },
    { // tên lớp
      title: 'Lớp', dataIndex: 'TenLop', key: 'TenLop', ellipsis: true,
      render: (name: string, lophoc: ClassDB) =>
        <Link to={`/admin/classes/${lophoc.ID}`} style={{ fontWeight: 'bold' }}>
          <ReadOutlined /> {name} </Link>
    },
    { // giáo viên
      title: 'Giáo viên', dataIndex: ['GiaoVien', 'HoTen'], key: 'HoTen', ellipsis: true,
      render: (name: string) => <Text><UserOutlined style={{ color: '#8c8c8c' }} /> {name}</Text>
    },
    { // khai giảng = ngày bắt đầu
      title: 'Khai giảng', dataIndex: 'TuNgay', key: 'TuNgay', width: 130,
      render: (day: string) =>
        <Text><CalendarOutlined style={{ color: '#8c8c8c' }} /> {new Date(day).toLocaleDateString()}</Text>
    },
    { // lịch học
      title: 'Lịch học', dataIndex: 'LichHoc', key: 'LichHoc',
      render: (schedule: number[], lophoc: ClassDB) => {
        const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
        const result = schedule.map(m => dow[m]).join('-')

        return <Space orientation="vertical" size={0}>
          <Text ><ClockCircleOutlined style={{ color: '#8c8c8c' }} /> {lophoc.GioHoc}</Text>
          <Text
            style={{ fontSize: '14px', display: 'block', textAlign: 'center' }}>
            {result}
          </Text>
        </Space>
      }
    },
    { // sĩ số
      title: 'Sĩ số', dataIndex: 'SiSo', key: 'SiSo',
      render: (classSize: number, lophoc: ClassDB) => {
        const percent = (lophoc.TongGhiDanh / classSize) * 100
        let percentColor = '#ff4d4f' // đỏ
        if (percent > 50) percentColor = '#faad14' //vàng
        if (percent > 80) percentColor = '#52c41a'
          return <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{lophoc.TongGhiDanh}/{classSize}</span>
              <span style={{ color: '#999' }}>Học viên</span>
            </div>
            <Progress
              percent={percent}
              strokeColor={percentColor}
              showInfo={false}
            />
          </>
      }
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
  ]

  if (loading)
    return <div style={{ minHeight: '89vh', background: '#f0f2f5' }}>
      <Skeleton loading={loading} active paragraph={{ rows: 6 }} />
    </div>

  if (!course) return <div style={{ padding: 24, minHeight: '89vh', background: '#f0f2f5' }}>
    <Space orientation='vertical' size={3}>
      <Title level={4}>Không tìm thấy khóa học</Title>
      <Button onClick={() => navigate(-1)}>Quay lại</Button>
    </Space>
  </div>

  return (
    // div này bọc toàn bộ nội dung trang chi tiết */}
    <div style={{ minHeight: '89vh', background: '#f0f2f5' }}>

      {/* Phần HEADER */}
      <div style={{
        background: '#fff', margin: '18px', padding: '18px',
        borderBlock: '1px solid #e8e8e8', borderRadius: 10
      }}>

        {/* Tiêu đề, avata */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Nút quay lại */}
            <Button size="large" type="text" icon={<LeftOutlined />}
              onClick={() => navigate(-1)} />

            <Avatar shape="square" size={49} style={{ background: `#0d6efd` }}>
              {course.MaKhoaHoc.substring(0, 4)}
            </Avatar>

            <div>
              <Title level={3} style={{ margin: 0 }}>
                KH. {course.TenKhoaHoc.toLocaleUpperCase()}
                <Tag color={status.color}
                  style={{ marginLeft: 10, verticalAlign: 'middle' }}>
                  {course.TrangThai}</Tag>
              </Title>

              <Text type="secondary">Mã: {course.MaKhoaHoc}</Text>
            </div>
          </div>
          <Tooltip title='Sửa khóa học'>
            <Button type="link" icon={<EditOutlined />}
              disabled={course.TrangThai === 'INACTIVE'}
              onClick={() => { setOpenCourseModal(true) }}
            />
          </Tooltip>
        </div>
        <CourseModal
          open={openCourseModal}
          onCancel={() => setOpenCourseModal(false)}
          onSave={initData}// chạy lại hàm
          editingCourse={course}
        />
      </div>{/*  div của header */}

      {/* div của body */}
      <div style={{ padding: '0px 18px 0px 18px' }}>
        <Card>
          <Tabs
            defaultActiveKey="1"
            tabBarExtraContent={
              <Button type="primary" icon={<PlusOutlined />}
                disabled={course.TrangThai === 'INACTIVE'}
                onClick={() => setOpenClassModal(true)}
              >Mở lớp mới
              </Button>}
            items={[
              {
                key: '1',
                label: `Danh sách lớp học (${classes.length})`,
                children: (
                  <Table style={{ marginTop: 8 }}
                    dataSource={classes}
                    columns={columns}
                    pagination={{ defaultPageSize: 6 }}
                    rowKey="ID"
                    scroll={{ y: 320 }}
                    rowClassName={
                      (record) =>
                        record.ID === classId ? 'highlight-row' : ''
                    }
                  />
                ),
              },
              {
                key: '2',
                label: 'Thông tin chung',
                children: (
                  <TabInfo course={course}
                    classes={classes.length}
                    totalStu={totalStudent}
                  />
                ),
              }
            ]} /> {/* kết thúc tab */}
        </Card>
        <ClassModal
          open={openClassModal}
          onCancel={() => setOpenClassModal(false)}
          khoahocId={Number(id)}
          onSave={SaveClassModal}
          editingClass={null!}
        />
      </div>
    </div>
  )
}

export default CourseDetail