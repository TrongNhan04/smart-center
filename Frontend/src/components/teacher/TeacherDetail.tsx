import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import type { TeacherDB } from "./TeacherDTO"
import type { TeacherClass } from "../class/ClassDTO"
import teacherApi from "../../api/teacherApi"
import {
  Avatar, Button, Card, Col, Descriptions, notification, Progress,
  Row, Skeleton, Space, Statistic, Table, Tabs, Tag, Tooltip, Typography
} from "antd"
import classApi from "../../api/classApi"
import {
  BookOutlined, CalendarOutlined, ClockCircleOutlined, EditOutlined,
  InfoCircleOutlined, MailOutlined, PhoneOutlined, ReadOutlined
} from "@ant-design/icons"
import TeacherModal from "./TeacherModal"
const { Text, Title } = Typography

const TeacherDetail = () => {
  const { id } = useParams()
  const [teacher, setTeacher] = useState<TeacherDB | null>(null)
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [openTeacherModal, setOpenTeacherModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const teacherId = Number(id)
  const navigate = useNavigate() // làm nút quay lại

  const handleError = (error: any) => {
    notification.error({
      title: 'Có lỗi xảy ra',
      description: error.response.data.message,
      showProgress: true,
      pauseOnHover: true
    })
  }

  const initData = async () => {
    try {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 400))
      const [teacherRes, classRes] = await Promise.all([
        teacherApi.findOne(teacherId),
        classApi.getByTeacherId(teacherId),
      ])
      setTeacher(teacherRes.data)
      setClasses(classRes.data)
    } catch (error) {
      handleError(error)
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!teacherId || isNaN(teacherId)) {
      console.log("id không phải số nên teacherId lỗi!", teacherId)
      return
    }
    initData()
  }, [teacherId])

  if (!teacher && !loading)
    return <div>Không tìm thấy giáo viên</div>

  const statusColor: Record<string, { color?: string, text?: string }> = {
    ACTIVE: { color: 'green', text: 'Đang hoạt động' },
    INACTIVE: { color: 'error', text: 'Ngừng hoạt động' }
  }
  const status = teacher ? statusColor[teacher.TrangThai] : { color: 'default', text: '' }

  const columnsOfClass = [
    {// mã lớp + tên lớp 
      title: 'Lớp học', dataIndex: 'MaLopHoc', key: 'MaLopHoc', ellipsis: true,
      render: (code: string, lophoc: TeacherClass) => (
        <Space orientation="vertical" size={0}>
          <Link to={`/admin/classes/${lophoc.ID}`}>{lophoc.TenLop}</Link>
          <Text code style={{ fontSize: 14 }}>{code}</Text>
        </Space>
      )
    },
    { // khai giảng = ngày bắt đầu
      title: 'Khai giảng', dataIndex: 'TuNgay', key: 'TuNgay', width: 130,
      render: (day: string) =>
        <Text><CalendarOutlined /> {new Date(day).toLocaleDateString()}</Text>
    },
    { // lịch học
      title: 'Lịch học', dataIndex: 'LichHoc', key: 'LichHoc',
      render: (timeTable: number[], lophoc: TeacherClass) => {
        const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
        const result = timeTable.map(m => dow[m]).join('-')

        {/* orientation="vertical" giúp xếp chồng lên nhau */ }
        return <Space orientation="vertical" size={0}>
          <Text strong><ClockCircleOutlined /> {lophoc.GioHoc}</Text>
          <Text type="secondary"
            style={{ fontSize: '14px', display: 'block', textAlign: 'center' }}>
            {result}
          </Text>
        </Space>
      }
    },
    { // Tiến độ
      title: 'Tiến độ', dataIndex: 'SoBuoiDaHoc', key: 'SoBuoiDaHoc',
      render: (bdh: number, lophoc: TeacherClass) => (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>{bdh}/{lophoc.TongSoBuoi}</Text>
            <Text type="secondary">Buổi học</Text>
          </div>
          <Progress
            percent={(bdh / lophoc.TongSoBuoi) * 100}
            showInfo={false}
          />
        </>
      )
    },
    { //xem chi tiết
      title: 'Thao tác', dataIndex: 'ChiTiet', key: 'ChiTiet',
      align: 'center' as const,
      render: (_: any, lophoc: TeacherClass) =>
        <Tooltip title='Chi tiết tiến độ'>
          <Button type="primary" size="small"
            icon={<InfoCircleOutlined />}
            // { path: `classes/:classId/sessions/:sessionId`, element: <SessionDetail /> },
            onClick={() =>
              navigate(`/admin/classes/${lophoc.ID}/sessions/${lophoc.IDBuoiDau}`)} />
        </Tooltip>
    },
  ]

  if (loading)
    return <div style={{ minHeight: '89vh', background: '#f0f2f5' }}>
      <Skeleton loading={loading} active paragraph={{ rows: 6 }} />
    </div>

  if (!teacher) return <div style={{ minHeight: '89vh', background: '#f0f2f5' }}>
    <div>Không tìm thấy giáo viên</div>
  </div>

  return (
    <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
      {/* div này bọc toàn bộ nội dung trang chi tiết */}
      <div style={{ minHeight: '89vh', background: '#f0f2f5' }}>
        {/* Phần HEADER */}
        <div style={{
          background: '#fff', margin: '18px', padding: '18px',
          borderBlock: '1px solid #e8e8e8', borderRadius: 10
        }}>

          {/* Tiêu đề, avata */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Nút quay lại */}
              <Button onClick={() => navigate(-1)}> Quay lại
              </Button>

              <Avatar shape="square" size={49} style={{ background: `#0d6efd` }}>
                {teacher?.MaGiaoVien.substring(0, 4)}
              </Avatar>

              <div>
                <Title level={3} style={{ margin: 0 }}>
                  GV. {teacher?.HoTen.toUpperCase()}
                  <Tag color={status.color}
                    style={{ marginLeft: 10, verticalAlign: 'middle' }}>
                    {status.text}</Tag>
                </Title>

                <Text type="secondary">Mã GV: {teacher?.MaGiaoVien}</Text>
              </div>
            </div>
            <Tooltip title='Sửa thông tin'>
              <Button type="primary" ghost icon={<EditOutlined />}
                disabled={teacher?.TrangThai === 'INACTIVE'}
                onClick={() => { setOpenTeacherModal(true) }}
              />
            </Tooltip>
          </div>
          <TeacherModal
            open={openTeacherModal}
            onCancel={() => setOpenTeacherModal(false)}
            onSave={initData}
            editing={teacher!}
          />
        </div>{/*  div của header */}

        {/* div của body */}
        <div style={{ padding: '0px 18px 0px 18px' }}>
          <Row gutter={18}>
            {/* cột trái: bảng lớp học */}
            <Col span={19}>
              <Card>
                <Tabs
                  defaultActiveKey="1"
                  items={[
                    {
                      key: '1',
                      label: `Lớp được phân công (${classes.length})`,
                      children: (
                        <Table style={{ marginTop: 8 }}
                          dataSource={classes}
                          columns={columnsOfClass}
                          pagination={{ defaultPageSize: 6 }}
                          rowKey="ID"
                          scroll={{ y: 310 }}
                        />
                      ),
                    },
                    {
                      key: '2',
                      label: `Các buổi đã dạy ()`,
                      children: (<></>
                        // <Table style={{ marginTop: 8 }}
                        //   dataSource={sessions}
                        //   columns={columnsOfSS}
                        //   pagination={{ defaultPageSize: 8 }}
                        //   rowKey="ID"
                        //   scroll={{ y: 308 }}
                        // />
                      ),
                    }
                  ]} /> {/* kết thúc tab */}
                {/* <SessionDrawer
                open={openSsDrawer}
                onCancel={() => setOpenSsDrawer(false)}
                sessionId={sessionId!}
              /> */}
              </Card>
            </Col>

            {/* Cột phải: chứa thông tin tổng quan */}
            <Col span={5}>
              <Card title="Thông tin giáo viên" style={{ marginBottom: 18 }}>
                <Descriptions
                  column={1}
                  size="small"
                  colon={false}
                >
                  <Descriptions.Item // email
                    label={<span style={{ color: '#888' }}>
                      <MailOutlined /> Email:</span>}
                  >
                    <Text strong>{teacher?.Email || 'Chưa cập nhật...'}</Text>
                  </Descriptions.Item>

                  <Descriptions.Item // SĐT
                    label={<span style={{ color: '#888' }}>
                      <PhoneOutlined /> SĐT:</span>}
                  >
                    <Text strong>{teacher?.DienThoai || 'Chưa cập nhật...'}</Text>
                  </Descriptions.Item>

                  <Descriptions.Item // Chuyên môn
                    label={<span style={{ color: '#888' }}>
                      <BookOutlined /> CM:</span>}
                  >{teacher?.ChuyenMon || 'Chưa cập nhật...'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* thống kê nhanh */}
              <Card>
                <Row gutter={16}>
                  {/* <Col span={12}> */}
                  <Statistic
                    title="Số buổi đã dạy trong tháng"
                    value={teacher?.SoBuoiDaDay}
                    prefix={<ReadOutlined />}
                  />
                </Row>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </Skeleton>
  )
}

export default TeacherDetail