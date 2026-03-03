import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import type { StudentDB } from "./StudentDTO"
import type { ClassDB } from "../class/ClassDTO"
import type { SS_StudentDetail } from "../session/SessionDTO"
import { studentApi } from "../../api/studentApi"
import classApi from "../../api/classApi"
import { sessionApi } from "../../api/sessionApi"
import {
  Avatar, Badge, Button, Card, Col, Descriptions, notification,
  Popover, Row, Space, Statistic, Table, Tabs, Tag, Tooltip, Typography
} from "antd"
import {
  ArrowLeftOutlined, CalendarOutlined, ClockCircleOutlined,
  EditOutlined, EnvironmentOutlined, MailOutlined, PhoneOutlined, ReadOutlined, UserOutlined
} from "@ant-design/icons"
import StudentModal from "./StudentModal"
import { DateHelper } from "../common/date.helper"

const { Text, Title } = Typography

const StudentDetail = () => {
  const { id } = useParams()
  const studentId = Number(id)
  const [student, setStudent] = useState<StudentDB | null>(null)
  const [classes, setClasses] = useState<ClassDB[]>([])
  const [sessions, setSessions] = useState<SS_StudentDetail[]>([])
  const [openStudentModal, setopenStudentModal] = useState(false)
  const navigate = useNavigate()

  const fetchStudent = async () => {
    try {
      const res = await studentApi.findOne(studentId)
      setStudent(res.data)
    } catch (error: any) {
      handleError(error)
      console.log("Có lỗi hàm fetchStudent: ", error)
    }
  }

  const fetchClasses = async () => {
    try {
      const res = await classApi.getByStudentId(studentId)
      setClasses(res.data)
    } catch (error: any) {
      handleError(error)
      console.log("Có lỗi hàm fetchClasses: ", error)
    }
  }

  const fetchCompletedSS = async () => {
    try {
      const res = await sessionApi.getCompletedByStudentId(studentId)
      setSessions(res.data)
    } catch (error: any) {
      handleError(error)
      console.log("Có lỗi hàm fetchClasses: ", error)
    }
  }

  const handleError = (error: any) => {
    notification.error({
      title: 'Có lỗi xảy ra',
      description: error.response.data.message,
      showProgress: true,
      pauseOnHover: true
    })
  }

  useEffect(() => {
    const initData = async () => {
      try {
        await Promise.all([
          fetchStudent(), fetchClasses(), fetchCompletedSS()
        ])
        // console.log('Data: ', student)

      } catch (error) {
        console.log("lỗi chạy useEffect: ", error)
      }
    }
    if (!studentId || isNaN(studentId)) {
      console.log("id không phải số nên studentId lỗi!", studentId)
      return
    }
    initData()
  }, [studentId])

  if (!student)
    return <div>Không tìm thấy học viên</div>

  const statusColor: Record<string, { color: string, text: string }> = {
    ACTIVE: { color: 'green', text: 'Đang hoạt động' },
    INACTIVE: { color: 'error', text: 'Ngừng hoạt động' }
  }
  const status = statusColor[student.TrangThai]

  const now = new Date()
  const totalSSofM = sessions.filter(
    f => new Date(f.BatDauLuc).getMonth() === now.getMonth())

  const columnsOfClass = [
    {// mã lớp + tên lớp 
      title: 'Lớp học', dataIndex: 'MaLopHoc', key: 'MaLopHoc', ellipsis: true,
      render: (code: string, lophoc: ClassDB) => (
        <Space orientation="vertical">
          <Link to={`/admin/classes/${lophoc.ID}`}>{lophoc.TenLop}</Link>
          <Text type="secondary" style={{ fontSize: 14 }}>{code}</Text>
        </Space>
      )
    },
    { // giáo viên
      title: 'Giáo viên', dataIndex: ['GiaoVien', 'TenGiaoVien'],
      key: 'TenGiaoVien', ellipsis: true
    },
    { // khai giảng = ngày bắt đầu
      title: 'Khai giảng', dataIndex: 'TuNgay', key: 'TuNgay', width: 130,
      render: (day: string) =>
        <Text><CalendarOutlined /> {new Date(day).toLocaleDateString()}</Text>
    },
    { // lịch học
      title: 'Lịch học', dataIndex: 'LichHoc', key: 'LichHoc', align: 'center' as const,
      render: (timeTable: number[], lophoc: ClassDB) => {
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

  const columnsOfSS = [
    {// Buổi số
      title: 'Buổi', dataIndex: 'BuoiSo', width: 100,
      key: 'BuoiSo', align: 'center' as const,
      render: (value: number, session: SS_StudentDetail) => {
        const className = classes.find(item => item.ID === session.LopHocID)
        return <Popover
          content={(
            <div>
              <p><ReadOutlined /> Chủ đề: {session.ChuDe ?? 'Chưa cập nhật...'}</p>
              <p><EnvironmentOutlined /> Phòng học: {session.PhongHoc ?? 'Chưa cập nhật...'}</p>
            </div>
          )}
          title={`Lớp ${className?.TenLop}`}>
          {value}
        </Popover>
      }
    },
    { // Thời gian
      title: 'Thời gian', dataIndex: 'BatDauLuc', width: 140,
      key: 'BatDauLuc', //ellipsis: 
      filters: [
        { text: "Tháng 1", value: 0 }, { text: "Tháng 2", value: 1 },
        { text: "Tháng 3", value: 2 }, { text: "Tháng 4", value: 3 },
        { text: "Tháng 5", value: 4 }, { text: "Tháng 6", value: 5 },
        { text: "Tháng 7", value: 6 }, { text: "Tháng 8", value: 7 },
        { text: "Tháng 9", value: 8 }, { text: "Tháng 10", value: 9 },
        { text: "Tháng 11", value: 10 }, { text: "Tháng 12", value: 11 },
      ],
      onFilter: (value: any, session: SS_StudentDetail) => {
        return new Date(session.BatDauLuc).getMonth() === value
      },
      render: (value: string, session: SS_StudentDetail) => {
        return <Space orientation="vertical" size={0}>
          <Text strong>
            <CalendarOutlined /> {new Date(value).toLocaleDateString()}
          </Text>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            <ClockCircleOutlined /> {DateHelper.ISOToHHMM
              (value, session.KetThucLuc)}
          </Text>
        </Space>
      }
    },
    {// Giáo viên 
      title: 'Giáo viên', dataIndex: 'TenGiaoVien', key: 'TenGiaoVien', ellipsis: true,
      render: (value: string, session: SS_StudentDetail) =>
        <Link to={`/admin/teachers/${session.GiaoVienID}`}>{value}</Link>
    },
    { // điểm danh
      title: 'Điểm danh', dataIndex: 'DiemDanh', key: 'DiemDanh', width: 120,
      filters: [
        { text: 'Có mặt', value: true },
        { text: 'Vắng mặt', value: false }
      ],
      onFilter: (value: any, session: SS_StudentDetail) =>
        session.DiemDanh === value,
      render: (value: boolean) => {
        if (value) return <Tag color='green'>Có mặt</Tag>
        return <Tag color='error'>Vắng mặt</Tag>
      }
    },
    {// nhận xét
      title: 'Nhận xét', dataIndex: 'NhanXet', key: 'NhanXet', ellipsis: true
    },
    {// điểm
      title: 'Điểm', dataIndex: 'Diem', key: 'Diem', width: 110,
      align: 'center' as const,
      render: (value: number) => value ?? '-'
    }
  ]

  return (
    // div này bọc toàn bộ nội dung trang chi tiết
    <div style={{ minHeight: 'calc(100vh - 64px)', background: '#f0f2f5' }}>
      {/* Phần HEADER */}
      <div style={{ background: '#fff', padding: '16px 24px', borderBlock: '1px solid #e8e8e8' }}>
        {/* nút quay lại */}
        <Button icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        >
          Quay lại
        </Button>

        {/* Tiêu đề, avata */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginTop: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar shape="square" size={49}
              style={{ background: `#0d6efd` }}
            >
              {student.MaHocVien}
            </Avatar>

            <div>
              <Title level={3} style={{ margin: 0 }}>
                {student.TenHocVien.toUpperCase()}
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
          onSave={fetchStudent}
          editing={student}
        />
      </div>{/*  div của header */}

      {/* div của body */}
      <div style={{ padding: '24px' }}>
        <Row gutter={24}>
          {/* cột trái: bảng lớp học */}
          <Col span={18}>
            <Card>
              <Tabs
                defaultActiveKey="1"
                items={[
                  {
                    key: '1',
                    label: `Lớp ghi danh (${classes.length})`,
                    children: (
                      <Table
                        //style={{ marginTop: 8 }}
                        dataSource={classes}
                        columns={columnsOfClass}
                        pagination={{ defaultPageSize: 5 }}
                        rowKey="ID"
                        scroll={{ y: 280 }}
                      />
                    ),
                  },
                  {
                    key: '2',
                    label: `Kết quả buổi học (${sessions.length})`,
                    children: (
                      <Table //style={{ marginTop: 8 }}
                        dataSource={sessions}
                        columns={columnsOfSS}
                        pagination={{ defaultPageSize: 8 }}
                        rowKey="ID"
                        scroll={{ y: 280 }}
                      />
                    ),
                  }
                ]} /> {/* kết thúc tab */}
            </Card>
          </Col>

          {/* Cột phải: chứa thông tin tổng quan */}
          <Col span={6}>
            <Card title="Thông tin học viên" style={{ marginBottom: 24 }}>
              <Descriptions
                column={1}
                size="small"
                colon={false}
              >
                <Descriptions.Item // Phụ huynh
                  label={<span style={{ color: '#888' }}>
                    <UserOutlined /> PH:</span>}
                >
                  <Text strong>{student.PhuHuynh || 'Chưa cập nhật...'}</Text>
                </Descriptions.Item>

                <Descriptions.Item // email
                  label={<span style={{ color: '#888' }}>
                    <MailOutlined /> Mail:</span>}
                >
                  <Text strong>{student.Email || 'Chưa cập nhật...'}</Text>
                </Descriptions.Item>

                <Descriptions.Item // SĐT
                  label={<span style={{ color: '#888' }}>
                    <PhoneOutlined /> SĐT:</span>}
                >
                  <Text strong>{student.DienThoai || 'Chưa cập nhật...'}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* thống kê nhanh */}
            <Card>
              <Row gutter={16}>
                {/* <Col span={12}> */}
                <Statistic
                  title={`Số buổi đã học trong tháng ${now.getMonth() + 1}`}
                  value={totalSSofM.length}
                  prefix={<ReadOutlined />}
                />
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default StudentDetail