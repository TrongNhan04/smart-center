import {
  CalendarOutlined, ClockCircleOutlined, EditOutlined, EnvironmentOutlined, InboxOutlined,
  PlusOutlined, ReadFilled, ReadOutlined, UnlockOutlined
}
  from "@ant-design/icons"
import {
  Avatar, Badge, Button, Card, message, notification, Popconfirm, Skeleton,
  Space, Table, Tabs, Tag, Tooltip, Typography
} from "antd"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import type { ClassDB } from "./ClassDTO"
import { useEffect, useState } from "react"
import classApi from "../../api/classApi"
import { sessionApi } from "../../api/sessionApi"
import type { SessionDB } from "../session/SessionDTO"
import { DateHelper } from "../common/date.helper"
import ClassModal from "./ClassModal"
import SessionAction from "../session/SessionAction"
import SessionsModal from "../session/SessionsModal"
import { useAuthStore } from "../../store/useAuthStore"
import TabInfo from "./TabInfo"
import TabStudent from "./TabStudent"

const { Title, Text } = Typography

const ClassDetail = () => {
  const { id } = useParams()
  const classId = Number(id)
  const [lophoc, setLopHoc] = useState<ClassDB | null>(null)
  const [sessions, setSessions] = useState<SessionDB[]>([])
  const [openClassModal, setOpenClassModal] = useState(false)
  const [openSessionModal, setOpenSessionModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [searchParam, setSearchParam] = useSearchParams()
  const currentPage = Number(searchParam.get('page')) || 1
  const user = useAuthStore(state => state.user)
  const isAdmin = user?.role === 'ADMIN'

  const initData = async () => {
    try {
      setLoading(true)
      const [classRes, sessionRes] = await Promise.all([
        classApi.findOne(classId),
        sessionApi.getByClassId(classId)
      ])
      setLopHoc(classRes.data)
      setSessions(sessionRes.data)
    } catch (error: any) {
      notification.error({
        title: 'Có lỗi xảy ra',
        description: error?.response?.data?.message,
        showProgress: true,
        pauseOnHover: true
      })
      console.log("Có lỗi xảy ra", error)
    }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!classId || isNaN(classId)) return
    initData()
  }, [classId])

  const statusColor: Record<string, string> = {
    OPEN: 'default', RUNNING: 'processing',
    CLOSED: 'error', FINISHED: 'success'
  } // status cho tiêu đề
  const status = lophoc ? statusColor[lophoc.TrangThai] : 'default'

  const columns = [
    {// Buổi số
      title: 'Buổi số', dataIndex: 'BuoiSo', width: 90,
      key: 'BuoiSo', align: 'center' as const,
      render: (value: number) => value
    },
    { // Thời gian
      title: 'Thời gian', dataIndex: 'BatDauLuc', width: 150,
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
          <Text >
            <ReadOutlined /> {topic ?? `Chủ đề: chưa cập nhật...`}
          </Text>
          <Text >
            <EnvironmentOutlined /> {session.PhongHoc ?? `Phòng: _`}
          </Text>
        </Space>
      }
    },
    { // trạng thái
      title: 'Trạng thái', dataIndex: 'TrangThai', key: 'TrangThai',
      align: 'center' as const,
      filters: [
        { text: 'Sắp tới', value: 'SCHEDULED' },
        { text: 'Hoàn thành', value: 'COMPLETED' },
        { text: 'Đã hủy', value: 'CANCELLED' },
        { text: 'Chưa nộp KQ', value: 'UNSUBMIT' }
      ], // value là của thằng filter
      onFilter: (value: any, session: SessionDB) => session.TrangThai === value,
      render: (value: string) => {
        const statusMap: Record<string, { color: string, text: string }> = {
          SCHEDULED: { color: 'default', text: 'Sắp tới' },
          COMPLETED: { color: 'success', text: 'Hoàn thành' },
          CANCELLED: { color: 'error', text: 'Đã hủy' },
          UNSUBMIT: { color: 'processing', text: 'Chưa nộp KQ' }
        }
        // value là 1 trong 3 key đó
        const status = statusMap[value]
        return <Badge status={status.color as any} text={status.text} />
      }
    },
    {// tình trạng khóa - Admin mở khóa 
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
      title: 'Thao tác', key: 'action', align: 'center' as const, //width: 120,
      render: (value: SessionDB) => {
        return isAdmin ? <SessionAction
          session={value}
          unlock={handleUnlock}
          onCancel={handleCancel}
        />
          : <Button onClick={() => navigate(`/teacher/sessions/${value.ID}`)}>
            Xem chi tiết</Button>
      }
    }
  ]

  const filterColumns = () => {
    if (isAdmin) return columns
    return columns.filter(item => item.key !== 'AdminMoKhoa')
  }

  const AutoGenerate = async (classId: number) => {
    try {
      const res = await sessionApi.generateAuto(classId)
      initData()
      message.success(`Đã tạo thành công ${res.data.length} buổi học`)
    } catch (error: any) {
      // bắt lỗi từ backend
      if (error.response) {
        const serverError = error.response.data
        // nếu là mảng lỗi thì lấy cái đầu tiên
        if (Array.isArray(serverError.message))
          message.error(serverError.message[0])
        else if (typeof serverError.message === 'string')
          notification.error({
            title: 'Có lỗi xảy ra',
            description: error?.response?.data?.message,
            showProgress: true,
            pauseOnHover: true
          })
        else
          console.log("Có lỗi xảy ra", error)
      }
    }
  }

  const handleUnlock = async (sessionId: number) => {
    try {
      await sessionApi.unlock(sessionId)
      // console.log('res của unlock: ', res.data)
      message.success('Thao tác thành công')
      initData()
    } catch (error) {
      message.error('Có lỗi xảy ra')
      console.log('Có lỗi xảy ra: ', error)
    }
  }

  const handleCancel = async (sessionId: number, reason: string) => {
    try {
      await sessionApi.cancel(sessionId, reason)
      message.success('Thao tác thành công')
      initData()
    } catch (error: any) {
      message.error('Có lỗi xảy ra')
      console.log('Có lỗi xảy ra: ', error?.response?.data?.message)
    }
  }

  const changeTablePage = (pagination: any) => setSearchParam({ page: pagination.current })

  if (loading) return <div style={{ minHeight: '89vh', background: '#f0f2f5' }}>
    <Skeleton loading={loading} active paragraph={{ rows: 6 }} />
  </div>
  if (!lophoc) return <div style={{ minHeight: '89vh', background: '#f0f2f5' }}>
    <div>Không tìm thấy lớp học</div>
  </div>

  return (
    // div này bọc toàn bộ nội dung trang chi tiết 
    <div style={{ minHeight: '89vh', background: '#f0f2f5' }}>
      {/* Phần HEADER */}
      <div style={{
        background: '#fff', margin: '18px', padding: '16px 24px',
        borderBlock: '1px solid #e8e8e8', borderRadius: 10
      }}>

        {/* Tiêu đề, avatar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* nút quay lại */}
            <Button onClick={() => navigate(-1)}> Quay lại</Button>

            <Avatar shape="square" size={49}
              style={{ background: `#0d6efd` }}
            > {lophoc?.MaLopHoc.substring(0, 4)}
            </Avatar>

            <div>
              <Title level={3} style={{ margin: 0 }}>
                LH. {lophoc?.TenLop.toUpperCase()}
                <Tag color={status}
                  style={{ marginLeft: 10, verticalAlign: 'middle' }}>
                  {lophoc?.TrangThai}
                </Tag>
              </Title>
              <Text type="secondary">Mã LH: {lophoc?.MaLopHoc}</Text>
            </div>
          </div>
          {/* là admin thì cho sửa */}
          {isAdmin && <><Tooltip title='Sửa lớp học'>
            <Button type="primary" ghost icon={<EditOutlined />}
              disabled={lophoc?.TrangThai === 'CLOSED' || lophoc?.TrangThai === 'FINISHED'}
              onClick={() => setOpenClassModal(true)}
            />
          </Tooltip>
            <ClassModal
              open={openClassModal}
              onCancel={() => setOpenClassModal(false)}
              onSave={(_) => initData()}
              khoahocId={lophoc.KhoaHoc.ID}
              editingClass={lophoc}
            />
          </>}
        </div>
      </div>{/* kết thúc div của header */}

      {/* div của body */}
      <div style={{ padding: '0px 18px 0px 18px' }}>

        <Card>
          <Tabs
            defaultActiveKey="1"
            tabBarExtraContent={ // 2 nút auto, manual
              isAdmin && <Space>
                <Popconfirm title="Xác nhận tạo buổi học tự động?"
                  description='Tự động tạo buổi học trong 1 tháng'
                  onConfirm={() => AutoGenerate(lophoc.ID)}>
                  <Button type="primary" icon={<PlusOutlined />}
                    disabled={lophoc?.TrangThai === 'CLOSED'}
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
                  onSave={initData}
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
                    columns={filterColumns()}
                    pagination={{
                      current: currentPage,
                      pageSize: 10
                    }}
                    onChange={changeTablePage}
                    rowKey="ID"
                    scroll={{ y: 320 }}
                  />
                ),
              },
              {
                key: '2',
                label: 'Danh sách học viên ',
                children: (<TabStudent id={lophoc.ID} />),
              },
              {
                key: '3',
                label: 'Thông tin chung',
                children: (<TabInfo lophoc={lophoc} />),
              }
            ]} /> {/* kết thúc tab */}
        </Card>
      </div>
    </div>
  )
}

export default ClassDetail