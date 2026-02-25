import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import type { StudentDB } from "./StudentDTO"
import type { ClassDB } from "../class/ClassDTO"
import type { SessionDB } from "../session/SessionDTO"
import { studentApi } from "../../api/studentApi"
import classApi from "../../api/classApi"
import { sessionApi } from "../../api/sessionApi"
import { Avatar, Breadcrumb, Button, Card, Col, Descriptions, notification, Row, Space, Statistic, Table, Tabs, Tag, Tooltip, Typography } from "antd"
import { EditOutlined, HomeOutlined, ReadOutlined } from "@ant-design/icons"
import StudentModal from "./StudentModal"

const {Text, Title} = Typography

const StudentDetail = () => {
  const { id } = useParams()
  const studentId = Number(id)
  const [student, setStudent] = useState<StudentDB | null>(null)
  const [classes, setClasses] = useState<ClassDB[]>([])
  const [sessions, setSessions] = useState<SessionDB[]>([])
  const [openStudentModal, setopenStudentModal] = useState(false)

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
  // const columnsOfClass = [
  //   {// mã lớp + tên lớp 
  //     title: 'Lớp học', dataIndex: 'MaLopHoc', key: 'MaLopHoc', ellipsis: true,
  //     render: (code: string, lophoc: ClassDB) => (
  //       <Space orientation="vertical">
  //         <Link to={`/admin/classes/${lophoc.ID}`}>{lophoc.TenLop}</Link>
  //         <Text type="secondary" style={{ fontSize: 14 }}>{code}</Text>
  //       </Space>
  //     )
  //   },
  //   { // khóa học
  //     title: 'Khóa học', dataIndex: ['KhoaHoc', 'TenKhoaHoc'],
  //     key: 'TenKhoaHoc', ellipsis: true
  //   },
  //   { // khai giảng = ngày bắt đầu
  //     title: 'Khai giảng', dataIndex: 'TuNgay', key: 'TuNgay', width: 130,
  //     render: (day: string) =>
  //       <Text><CalendarOutlined /> {new Date(day).toLocaleDateString()}</Text>
  //   },
  //   { // lịch học
  //     title: 'Lịch học', dataIndex: 'LichHoc', key: 'LichHoc',
  //     render: (timeTable: number[], lophoc: ClassDB) => {
  //       const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  //       const result = timeTable.map(m => dow[m]).join('-')

  //       {/* orientation="vertical" giúp xếp chồng lên nhau */ }
  //       return <Space orientation="vertical" size={0}>
  //         <Text strong><ClockCircleOutlined /> {lophoc.GioHoc}</Text>
  //         <Text type="secondary"
  //           style={{ fontSize: '14px', display: 'block', textAlign: 'center' }}>
  //           {result}
  //         </Text>
  //       </Space>
  //     }
  //   },
  //   { // sĩ số
  //     title: 'Sĩ số', dataIndex: 'SiSo', key: 'SiSo',
  //     render: (classSize: number, lophoc: ClassDB) => (
  //       <>
  //         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
  //           <span>{lophoc.TongGhiDanh}/{classSize}</span>
  //           <small style={{ color: '#999' }}>HV</small>
  //         </div>
  //         <Progress
  //           percent={(lophoc.TongGhiDanh / classSize) * 100}
  //           showInfo={false}
  //         />
  //       </>
  //     )
  //   },
  //   { // trạng thái
  //     title: 'Trạng thái', dataIndex: 'TrangThai', key: 'TrangThai',
  //     render: (value: string) => {
  //       const statusMap: Record<string, { color: string, text: string }> = {
  //         OPEN: { color: 'default', text: 'Tuyển sinh' },
  //         RUNNING: { color: 'success', text: 'Đang hoạt động' },
  //         CLOSED: { color: 'error', text: 'Đã đóng' }
  //       }
  //       // value là 1 trong 3 key đó
  //       const status = statusMap[value]
  //       return <Badge status={status.color as any} text={status.text} />
  //     }
  //   },
  // ]

  // const columnsOfSS = [
  //   {// Buổi số
  //     title: 'Buổi số', dataIndex: 'BuoiSo', width: 120,
  //     key: 'BuoiSo', align: 'center' as const,
  //     render: (value: number) => value
  //   },
  //   {// mã lớp + tên lớp 
  //     title: 'Lớp học', dataIndex: 'LopHocID', key: 'LopHocID',
  //     render: (classId: number) => {
  //       const className = classes.find(item => item.ID === classId)?.TenLop
  //       return <Link to={`/admin/classes/${classId}`}>{className}</Link>
  //     }
  //   },
  //   { // Thời gian
  //     title: 'Thời gian', dataIndex: 'BatDauLuc',
  //     key: 'BatDauLuc', //ellipsis: 
  //     filters: [
  //       { text: "Tháng 1", value: 0 }, { text: "Tháng 2", value: 1 }, 
  //       { text: "Tháng 3", value: 2 }, { text: "Tháng 4", value: 3 }, 
  //       { text: "Tháng 5", value: 4 }, { text: "Tháng 6", value: 5 },
  //       { text: "Tháng 7", value: 6 }, { text: "Tháng 8", value: 7 }, 
  //       { text: "Tháng 9", value: 8 }, { text: "Tháng 10", value: 9 }, 
  //       { text: "Tháng 11", value: 10 }, { text: "Tháng 12", value: 11 },
  //     ],
  //     onFilter: (value: any, session: SessionDB) => {
  //       return new Date(session.BatDauLuc).getMonth() === value
  //     },
  //     render: (value: string, session: SessionDB) => {
  //       return <Space orientation="vertical" size={0}>
  //         <Text strong>
  //           <CalendarOutlined /> {new Date(value).toLocaleDateString()}
  //         </Text>
  //         <Text type="secondary" style={{ fontSize: '14px' }}>
  //           <ClockCircleOutlined /> {DateHelper.ISOToHHMM
  //             (value, session.KetThucLuc)}
  //         </Text>
  //       </Space>
  //     }
  //   },
  //   { // Nội dung
  //     title: 'Nội dung', dataIndex: 'ChuDe', key: 'ChuDe', ellipsis: true,
  //     render: (topic: string, session: SessionDB) => {
  //       return <Space orientation="vertical" size={0}>
  //         <Text strong ellipsis={{ tooltip: topic }}>
  //           {topic ?? `Chủ đề: chưa cập nhật...`}</Text>
  //         <Text type="secondary" style={{ fontSize: '14px' }}>
  //           {session.PhongHoc ?? `Chưa cập nhật`}
  //         </Text>
  //       </Space>
  //     }
  //   },
  //   { // trạng thái
  //     title: 'Trạng thái', dataIndex: 'TrangThai', key: 'TrangThai',
  //     width: 130, align: 'center' as const,
  //     render: () => {
  //       return <Badge status='success' text='Hoàn thành' />
  //     }
  //   },
  //   {// thao tác
  //     title: 'Thao tác', key: 'action', align: 'center' as const, width: 90,
  //     render: (value: SessionDB) => <SessionAction
  //       session={value}
  //       unlock={() => { }}
  //       onCancel={() => { }}
  //       onOpenDrawer={() => { setOpenSsDrawer(true); setSessionId(value.ID) }}
  //     />
  //   }
  // ]

  return (
    // div này bọc toàn bộ nội dung trang chi tiết
    <div style={{ minHeight: 'calc(100vh - 64px)', background: '#f0f2f5' }}>
      {/* Phần HEADER */}
      <div style={{ background: '#fff', padding: '16px 24px', borderBlock: '1px solid #e8e8e8' }}>
        {/* Thanh bánh mì */}
        <Breadcrumb items={[
          { title: <Link to='/admin/home'><HomeOutlined /></Link> },
          { title: <Link to='/admin/students'>Học viên</Link> },
          { title: `GV. ${student.TenHocVien}` }
        ]} />

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
          <Col span={19}>
            <Card>
              <Tabs
                defaultActiveKey="1"
                items={[
                  {
                    key: '1',
                    label: `Lớp ghi danh (${classes.length})`,
                    children: (
                      <Table style={{ marginTop: 8 }}
                        // dataSource={classes}
                        // columns={columnsOfClass}
                        // pagination={{ defaultPageSize: 5 }}
                        // rowKey="ID"
                        // scroll={{ y: 290 }}
                      />
                    ),
                  },
                  {
                    key: '2',
                    label: `Các buổi đã học (${sessions.length})`,
                    children: (
                      <Table style={{ marginTop: 8 }}
                        // dataSource={sessions}
                        // columns={columnsOfSS}
                        // pagination={{ defaultPageSize: 8 }}
                        // rowKey="ID"
                        // scroll={{ y: 290 }}
                      />
                    ),
                  }
                ]} /> {/* kết thúc tab */}
            </Card>
          </Col>

          {/* Cột phải: chứa thông tin tổng quan */}
          <Col span={5}>
            <Card title="Thông tin chung" style={{ marginBottom: 24 }}>
              <Descriptions
                column={1}
                size="small"
                colon={false}
              >
                {/* <Descriptions.Item // email
                  label={<span style={{ color: '#888' }}>
                    <MailOutlined /> Email:</span>}
                >
                  <Text strong>{student.Email || 'Chưa cập nhật...'}</Text>
                </Descriptions.Item>

                <Descriptions.Item // SĐT
                  label={<span style={{ color: '#888' }}>
                    <PhoneOutlined /> SĐT:</span>}
                >
                  <Text strong>{student.DienThoai || 'Chưa cập nhật...'}</Text>
                </Descriptions.Item>

                <Descriptions.Item // Chuyên môn
                  label={<span style={{ color: '#888' }}>
                    <BookOutlined /> Chuyên môn:</span>}
                >{student.ChuyenMon || 'Chưa cập nhật...'}
                </Descriptions.Item> */}
              </Descriptions>
            </Card>

            {/* thống kê nhanh */}
            <Card>
              <Row gutter={16}>
                {/* <Col span={12}> */}
                <Statistic
                  title="Số buổi đã học trong tháng"
                  value={10}
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