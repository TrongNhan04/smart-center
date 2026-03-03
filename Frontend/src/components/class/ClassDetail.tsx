import {
  ArrowLeftOutlined, BookOutlined, CalendarOutlined, ClockCircleOutlined,
  EditOutlined, InboxOutlined, PlusOutlined, TeamOutlined, UnlockOutlined,
  UserOutlined
}
  from "@ant-design/icons"
import {
  Avatar, Badge, Button, Card, Col, Descriptions, message, Popconfirm,
  Progress, Row, Space, Statistic, Table, Tabs, Tag, Tooltip, Typography
} from "antd"
import { Link, useNavigate, useParams } from "react-router-dom"
import type { ClassDB } from "./ClassDTO"
import { useEffect, useState } from "react"
import classApi from "../../api/classApi"
import { sessionApi } from "../../api/sessionApi"
import type { SessionDB } from "../session/SessionDTO"
import { DateHelper } from "../common/date.helper"
import ClassModal from "./ClassModal"
import SessionAction from "../session/SessionAction"
import SessionsModal from "../session/SessionsModal"
import SessionDrawer from "../session/SessionDrawer"

const { Title, Text } = Typography

const ClassDetail = () => {
  const { id } = useParams()
  const classId = Number(id)
  const [lophoc, setLopHoc] = useState<ClassDB | null>(null)
  const [sessions, setSessions] = useState<SessionDB[]>([])
  const [openClassModal, setOpenClassModal] = useState(false)
  const [openSessionModal, setOpenSessionModal] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [sessionId, setSessionId] = useState(0)
  const navigate = useNavigate()

  const fetchClass = async () => {
    try {
      const res = await classApi.findOne(classId)
      setLopHoc(res.data)
    } catch (error: any) {
      message.error("Có lỗi xảy ra!")
      console.log("Có lỗi hàm fetchClass: ", error)
    }
  }

  const fetchSessions = async () => {
    try {
      const res = await sessionApi.getByClassId(classId)
      setSessions(res.data)
    } catch (error) {
      message.error("Có lỗi xảy ra!")
      console.log("Có lỗi hàm fetchSessions: ", error)
    }
  }

  useEffect(() => {
    const initData = async () => {
      try {
        await Promise.all([fetchClass(), fetchSessions()])
      } catch (error) {
        console.log("lỗi chạy useEffect: ", error)
      }
    }
    if (!classId || isNaN(classId)) {
      console.log("id không phải số nên classId lỗi!", classId)
      return
    }
    initData()
  }, [classId])

  if (!lophoc) return <div>Không tìm thấy lớp học</div>

  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  const result = lophoc.LichHoc.map(m => dow[m]).join('-')

  const statusColor: Record<string, string> = {
    OPEN: 'default',
    RUNNING: 'success',
    CLOSED: 'error',
  } // status cho tiêu đề
  const status = statusColor[lophoc.TrangThai]

  const columns = [
    {// Buổi số
      title: 'Buổi số', dataIndex: 'BuoiSo', width: 90,
      key: 'BuoiSo', align: 'center' as const,
      render: (value: number) => value
    },
    { // Thời gian
      title: 'Thời gian', dataIndex: 'BatDauLuc', width: 130,
      key: 'BatDauLuc', //ellipsis: 
      render: (value: string, session: SessionDB) => {
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
    { // Nội dung
      title: 'Nội dung', dataIndex: 'ChuDe', key: 'ChuDe', ellipsis: true,
      render: (topic: string, session: SessionDB) => {
        return <Space orientation="vertical" size={0}>
          <Text strong ellipsis={{ tooltip: topic }}>
            {topic ?? `Chủ đề: chưa cập nhật...`}</Text>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            {session.PhongHoc ?? `Chưa cập nhật`}
          </Text>
        </Space>
      }
    },
    { // trạng thái
      title: 'Trạng thái', dataIndex: 'TrangThai', key: 'TrangThai',
      width: 130, align: 'center' as const,
      filters: [
        { text: 'Sắp tới', value: 'SCHEDULED' },
        { text: 'Hoàn thành', value: 'COMPLETED' },
        { text: 'Đã hủy', value: 'CANCELLED' }
      ], // value là của thằng filter
      onFilter: (value: any, session: SessionDB) => {
        return session.TrangThai === value
      },
      render: (value: string) => {
        const statusMap: Record<string, { color: string, text: string }> = {
          SCHEDULED: { color: 'default', text: 'Sắp tới' },
          COMPLETED: { color: 'success', text: 'Hoàn thành' },
          CANCELLED: { color: 'error', text: 'Đã hủy' }
        }
        // value là 1 trong 3 key đó
        const status = statusMap[value]
        return <Badge status={status.color as any} text={status.text} />
      }
    },
    {// tình trạng khóa
      title: 'Tình trạng khóa', dataIndex: 'AdminMoKhoa', width: 160,
      key: 'AdminMoKhoa', align: 'center' as const,
      filters: [// tạo bộ lọc giả
        { text: 'Yêu cầu mở', value: 'REQUEST' },
        { text: 'Đang mở', value: 'OPEN' },
        { text: 'Đã khóa', value: 'LOCKED' }
      ],
      onFilter: (value: any, session: SessionDB) => {
        if (value === 'OPEN')
          return session.AdminMoKhoa === true
        if (value === 'REQUEST')
          return session.AdminMoKhoa === false && session.YeuCauMoKhoa === true
        if (value === 'LOCKED')
          return session.AdminMoKhoa === false && session.YeuCauMoKhoa === false
        return false
      },
      render: (adminMK: boolean, session: SessionDB) => {
        if (session.YeuCauMoKhoa)
          return <Tag color='orange'><InboxOutlined /> Yêu cầu mở</Tag>
        if (adminMK)
          return <Tag color='green'><UnlockOutlined /> Đang mở</Tag>
        else
          return <>-</>
      }
    },
    {// thao tác
      title: 'Thao tác', key: 'action', align: 'center' as const,
      render: (value: SessionDB) => <SessionAction
        session={value}
        unlock={handleUnlock}
        onCancel={handleCancel}
        onOpenDrawer={handleOpenDrawer}
      />
    }
  ]

  const AutoGenerate = async (classId: number) => {
    try {
      const res = await sessionApi.generateAuto(classId)
      console.log("Data của res auto gene:", res)
      fetchSessions()
      message.success(`Đã tạo thành công ${res.data.length} buổi học`)
    } catch (error: any) {
      // bắt lỗi từ backend
      console.log("Có lỗi xảy ra: ", error.response.data.message)

      if (error.response) {
        const serverError = error.response.data
        // nếu là mảng lỗi thì lấy cái đầu tiên
        if (Array.isArray(serverError.message))
          message.error(serverError.message[0])
        else if (typeof serverError.message === 'string')
          message.error({
            content: serverError.message,
            style: { marginTop: '10vh' },
            duration: 6
          })
        else
          message.error("Có lỗi xảy ra")
      }
    }
  }

  const handleUnlock = async (sessionId: number) => {
    try {
      await sessionApi.unlock(sessionId)
      // console.log('res của unlock: ', res.data)
      message.success('Thao tác thành công')
      fetchSessions()
    } catch (error) {
      message.error('Có lỗi xảy ra')
      console.log('Có lỗi xảy ra: ', error)
    }
  }

  const handleCancel = async (sessionId: number, reason: string) => {
    try {
      await sessionApi.cancel(sessionId, reason)
      message.success('Thao tác thành công')
      fetchSessions()
    } catch (error: any) {
      message.error('Có lỗi xảy ra')
      console.log('Có lỗi xảy ra: ', error.response.data.message)
    }
  }

  const handleOpenDrawer = (sessionId: number) => {
    //console.log("session: ClassDetail", session)
    setSessionId(sessionId)
    setOpenDrawer(true)
  }

  return (
    // div này bọc toàn bộ nội dung trang chi tiết
    <div style={{ minHeight: 'calc(100vh - 64px)', background: '#f0f2f5' }}>
      {/* Phần HEADER */}
      <div style={{ background: '#fff', padding: '16px 24px', borderBlock: '1px solid #e8e8e8' }}>
        {/* nút quay lại */}
        <Button icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}> Quay lại</Button>

        {/* Tiêu đề, avatar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginTop: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar shape="square" size={49}
              style={{ background: `#0d6efd` }}
            > {lophoc.MaLopHoc}
            </Avatar>

            <div>
              <Title level={3} style={{ margin: 0 }}>
                {lophoc.TenLop.toUpperCase()}
                <Tag color={status}
                  style={{ marginLeft: 10, verticalAlign: 'middle' }}>
                  {lophoc.TrangThai}</Tag>
              </Title>
              <Text type="secondary">Mã LH: {lophoc.MaLopHoc}</Text>
            </div>
          </div>
          <Tooltip title='Sửa lớp học'>
            <Button type="primary" ghost icon={<EditOutlined />}
              disabled={lophoc.TrangThai === 'CLOSED'}
              onClick={() => setOpenClassModal(true)}
            />
          </Tooltip>
        </div>
        <ClassModal
          open={openClassModal}
          onCancel={() => setOpenClassModal(false)}
          onSave={(_) => { fetchClass(); fetchSessions() }}
          khoahocId={lophoc.KhoaHoc.ID}
          editingClass={lophoc}
        />
      </div>{/* kết thúc div của header */}

      {/* div của body */}
      <div style={{ paddingTop: '24px', paddingLeft: '24px', paddingRight: '24px' }}>
        <Row gutter={24}>
          {/* cột trái: bảng buổi học và mô tả */}
          <Col span={18}>
            <Card>
              <Tabs
                defaultActiveKey="1"
                tabBarExtraContent={ // 2 nút auto, manual
                  <Space>
                    <Popconfirm title="Xác nhận tạo buổi học tự động?"
                      description='Tự động tạo buổi học trong 1 tháng'
                      onConfirm={() => AutoGenerate(lophoc.ID)}>
                      <Button type="primary" icon={<PlusOutlined />}
                        disabled={lophoc.TrangThai === 'CLOSED'}
                      >Tự động
                      </Button>
                    </Popconfirm>

                    <Button type="default" icon={<PlusOutlined />}
                      disabled={lophoc.TrangThai === 'CLOSED'}
                      onClick={() => setOpenSessionModal(true)}
                    >Thủ công</Button>
                    <SessionsModal
                      lophoc={lophoc}
                      open={openSessionModal}
                      onCancel={() => setOpenSessionModal(false)}
                      onSave={fetchSessions}
                    />
                  </Space>
                }
                items={[
                  { // table buổi học
                    key: '1',
                    label: `Danh sách buổi học (${sessions.length})`,
                    children: (
                      <Table style={{ marginTop: 8 }}
                        dataSource={sessions}
                        columns={columns}
                        pagination={{ defaultPageSize: 6 }}
                        rowKey="ID"
                        scroll={{ y: 280 }}
                      />
                    ),
                  },
                  {
                    key: '2',
                    label: 'Nội dung mô tả',
                    children: (
                      <Typography.Paragraph>
                        &nbsp;&nbsp;&nbsp;&nbsp;{lophoc.MoTa ?? `Chưa cập nhật...`}
                      </Typography.Paragraph>
                    ),
                  }
                ]} /> {/* kết thúc tab */}
            </Card>
            {/* khi nào mở drawer thì render drawer */}
            <SessionDrawer
              open={openDrawer}
              onCancel={() => setOpenDrawer(false)}
              sessionId={sessionId}
            />
          </Col>

          {/* Cột phải: chứa thông tin tổng quan */}
          <Col span={6}>
            {/* thông tin tổng quan  */}
            <Card title="Thông tin chung" style={{ marginBottom: 24 }}>
              <Descriptions column={1} size='small' colon={false} layout="horizontal" items={[
                { // khóa học
                  label: <><span style={{ color: '#888' }}>
                    <BookOutlined /> Khóa học: &nbsp;</span>
                    <Link to={`/admin/courses/${lophoc.KhoaHoc.ID}`}
                      style={{ fontWeight: 'bold' }}>
                      {lophoc.KhoaHoc.TenKhoaHoc}</Link>
                  </>
                },
                { // giáo viên
                  label: <><span style={{ color: '#888' }}>
                    <UserOutlined /> Giáo viên: &nbsp;</span>
                    <Link to={`/admin/teachers/${lophoc.GiaoVien.ID}`}
                      style={{ fontWeight: 'bold' }}>
                      {lophoc.GiaoVien.HoTen}</Link>
                  </>
                },
                { // khai giảng
                  label: <><span style={{ color: '#888' }}>
                    <CalendarOutlined /> Khai giảng: &nbsp;</span>
                    <Space orientation="vertical" size={0}>
                      <Text strong>
                        {new Date(lophoc.TuNgay).toLocaleDateString()}</Text>
                      <Text type="secondary">
                        ({new Date(lophoc.DenNgay).toLocaleDateString()})</Text>
                    </Space>
                  </>
                },
                { //lịch học
                  label: <><span style={{ color: '#888' }}>
                    <ClockCircleOutlined /> Lịch học: &nbsp;</span>
                    <Space orientation="vertical" size={0}>
                      <Text strong>{lophoc.GioHoc} &nbsp;</Text>
                      <Text type="secondary"> {`(${result})`}</Text>
                    </Space>
                  </>
                }
              ]}>
              </Descriptions>
            </Card>

            {/* thống kê nhanh */}
            <Card >
              <Statistic
                title="Tống học viên ghi danh"
                value={`${lophoc.TongGhiDanh}/${lophoc.SiSo}`}
                prefix={<TeamOutlined />}
              />
              <Progress
                percent={(lophoc.TongGhiDanh / lophoc.SiSo) * 100}
                showInfo={false}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default ClassDetail