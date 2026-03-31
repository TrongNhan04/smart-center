import { useEffect, useState } from "react"
import { Link, Outlet, useNavigate, useParams } from "react-router-dom"
import type { ClassForStudent, StudentDB } from "./StudentDTO"
import { studentApi } from "../../api/studentApi"
import classApi from "../../api/classApi"
import {
  Avatar, Button, Card, notification, Progress, Skeleton, Space, Table, Tag, Tooltip, Typography
} from "antd"
import {
  CalendarOutlined, ClockCircleOutlined, EditOutlined, InfoCircleOutlined,
} from "@ant-design/icons"
import StudentModal from "./StudentModal"

const { Text, Title } = Typography

const StudentDetail = () => {
  const { id } = useParams()
  const studentId = Number(id)
  const [student, setStudent] = useState<StudentDB | null>(null)
  const [classes, setClasses] = useState<ClassForStudent[]>([])
  const [openStudentModal, setopenStudentModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const handleError = (error: any) => {
    notification.error({
      title: 'Có lỗi xảy ra',
      description: error?.response?.data?.message,
      showProgress: true,
      pauseOnHover: true
    })
    console.log(error)
  }

  const initData = async () => {
    try {
      setLoading(true)
      const [studentRes, classRes] = await Promise.all([
        studentApi.findOne(studentId),
        classApi.getByStudentId(studentId)
      ])
      setStudent(studentRes.data)
      setClasses(classRes.data)
    } catch (error) {
      handleError(error)
    }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!studentId || isNaN(studentId)) {
      console.log("id không phải số nên studentId lỗi!", studentId)
      return
    }
    initData()
  }, [studentId])

  const statusColor: Record<string, { color: string, text: string }> = {
    ACTIVE: { color: 'green', text: 'Đang hoạt động' },
    INACTIVE: { color: 'error', text: 'Ngừng hoạt động' }
  }
  const status = student ? statusColor[student.TrangThai] : { color: 'default', text: '' }

  const columnsOfClass = [
    {// mã lớp + tên lớp 
      title: 'Lớp học', dataIndex: 'MaLopHoc', key: 'MaLopHoc', ellipsis: true,
      render: (code: string, lophoc: ClassForStudent) => (
        <Space orientation="vertical" size={0}>
          <Link to={`/admin/classes/${lophoc.ID}`}>{lophoc.TenLop}</Link>
          <Text type="secondary" style={{ fontSize: 14 }}>{code}</Text>
        </Space>
      )
    },
    { // giáo viên
      title: 'Giáo viên', dataIndex: 'GiaoVien',
      key: 'GiaoVien', ellipsis: true
    },
    {
      title: 'Ngày nhập học', dataIndex: 'NgayGhiDanh', key: 'NgayGhiDanh',
      align: 'center' as const, render: (day: string) =>
        <Text><CalendarOutlined /> {new Date(day).toLocaleDateString()}</Text>
    },
    { // lịch học
      title: 'Lịch học', dataIndex: 'LichHoc', key: 'LichHoc', align: 'center' as const,
      render: (timeTable: number[], lophoc: ClassForStudent) => {
        const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
        const result = timeTable.map(m => dow[m]).join('-')

        return <Space orientation="vertical" size={0}>
          <Text strong><ClockCircleOutlined /> {lophoc.GioHoc}</Text>
          <Text type="secondary"
            style={{ fontSize: '14px', display: 'block', textAlign: 'center' }}>
            {result}
          </Text>
        </Space>
      }
    },
    { // tiến độ
      title: 'Tiến độ', dataIndex: 'BuoiDaHoc', key: 'BuoiDaHoc',
      render: (value: number, lophoc: ClassForStudent) => {
        if (lophoc.TrangThaiGD === 'INACTIVE')
          return <Text delete>Đã hủy ghi danh</Text>
        return <>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{value}/{lophoc.TongSoBuoi}</span>
            <Text type="secondary">Buổi học</Text>
          </div>
          <Progress
            percent={(value / lophoc.TongSoBuoi) * 100}
            showInfo={false}
          />
        </>
      }
    },
    {
      title: 'Thao tác', dataIndex: 'action', key: 'action', align: 'center' as const,
      render: (_: any, lophoc: ClassForStudent) => <Button type="primary"
        icon={<InfoCircleOutlined />} size="small"
        onClick={() => navigate(`classes/${lophoc.ID}`)}> Chi tiết</Button>
    }
  ]

  if (loading)
    return <div style={{ minHeight: '89vh', background: '#f0f2f5' }}>
      <Skeleton loading={loading} active paragraph={{ rows: 6 }} />
    </div>

  if (!student) return <div style={{ minHeight: '89vh', background: '#f0f2f5' }}>
    <div>Không tìm thấy học viên</div>
  </div>

  return (
    // div này bọc toàn bộ nội dung trang chi tiết
    <div style={{ minHeight: '89vh', background: '#f0f2f5' }}>
      {/* Phần HEADER */}
      <div style={{
        background: '#fff', margin: '18px', padding: '16px 24px',
        borderBlock: '1px solid #e8e8e8', borderRadius: 10
      }}>
        {/* Tiêu đề, avata */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* nút quay lại */}
            <Button onClick={() => navigate(`/admin/students`)} > Quay lại
            </Button>

            <Avatar shape="square" size={49} style={{ background: `#0d6efd` }}>
              {student.MaHocVien.substring(0, 4)}
            </Avatar>

            <div>
              <Title level={3} style={{ margin: 0 }}>
                HV. {student.TenHocVien.toUpperCase()}
                <Tag color={status.color}
                  style={{ marginLeft: 10, verticalAlign: 'middle' }}>
                  {student.TrangThai}</Tag>
              </Title>

              <Text type="secondary">Mã HV: {student.MaHocVien}</Text>
            </div>
          </div>
          <Tooltip title='Sửa thông tin'>
            <Button type="primary" ghost icon={<EditOutlined />}
              disabled={student.TrangThai === 'INACTIVE'}
              onClick={() => { setopenStudentModal(true) }}
            />
          </Tooltip>
        </div>
        <StudentModal
          open={openStudentModal}
          onCancel={() => setopenStudentModal(false)}
          onSave={initData}
          editing={student}
        />
      </div>{/*  div của header */}

      {/* div của body */}
      <div style={{ padding: '0px 18px 0px 18px' }}>
        <Card title='Danh sách lớp ghi danh'>
          <Table
            //style={{ marginTop: 8 }}
            dataSource={classes}
            columns={columnsOfClass}
            pagination={{ defaultPageSize: 5 }}
            rowKey="ID"
            scroll={{ y: 320 }}
          />
        </Card>
      </div>

      <Outlet />
    </div> // div của toàn bộ
  )
}

export default StudentDetail