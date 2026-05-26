import {
  CalendarOutlined, EditOutlined, InboxOutlined, InfoCircleOutlined, LeftOutlined, PlusOutlined, ReadOutlined,
  UnlockOutlined
}
  from "@ant-design/icons"
import {
  Avatar, Badge, Button, Card, message, Popconfirm, Skeleton, Space, Table,
  Tabs, Tag, Tooltip, Typography
} from "antd"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import type { ClassDB } from "./ClassDTO"
import { useEffect, useState } from "react"
import classApi from "../../api/classApi"
import { sessionApi } from "../../api/sessionApi"
import type { SessionDB } from "../session/SessionDTO"
import ClassModal from "./ClassModal"
import SessionAction from "../session/SessionAction"
import SessionsModal from "../session/SessionsModal"
import { useAuthStore } from "../../store/useAuthStore"
import TabInfo from "./TabInfo"
import TabStudent from "./TabStudent"
import { CatchError } from "../common/catch.error"

const { Title, Text } = Typography

const ClassDetail = () => {
  const { classId } = useParams()
  const lopHocId = Number(classId)
  const [lophoc, setLopHoc] = useState<ClassDB | null>(null)
  const [sessions, setSessions] = useState<SessionDB[]>([])
  const [openClassModal, setOpenClassModal] = useState(false)
  const [openSessionModal, setOpenSessionModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [searchParam, setSearchParam] = useSearchParams()
  const currentPage = Number(searchParam.get('page')) || 1
  const currentTab = searchParam.get('tab') || 'sessions'
  const user = useAuthStore(state => state.user)
  const isAdmin = user?.role === 'ADMIN'

  const initData = async () => {
    try {
      setLoading(true)
      const [classRes, sessionRes] = await Promise.all([
        classApi.findOne(lopHocId),
        sessionApi.getByClassId(lopHocId)
      ])
      setLopHoc(classRes.data)
      setSessions(sessionRes.data)
    } catch (error: any) {
      CatchError.HandleError(error)
    }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!lopHocId || isNaN(lopHocId)) return
    initData()
  }, [lopHocId])

  const statusColor: Record<string, string> = {
    OPEN: 'default', RUNNING: 'processing',
    CLOSED: 'error', FINISHED: 'success'
  } // status cho tiêu đề
  const status = lophoc ? statusColor[lophoc.TrangThai] : 'default'

  const columns = [
    {// Buổi số
      title: 'Buổi số', dataIndex: 'BuoiSo', width: 90,
      key: 'BuoiSo', align: 'center' as const,
    },
    { // Thời gian
      title: 'Thời gian', dataIndex: 'BatDauLuc', width: 150,
      key: 'BatDauLuc', //ellipsis: 
      render: (value: string) => {
        return <Space orientation="vertical" size={0}>
          <Text><CalendarOutlined style={{ color: '#8c8c8c' }}
          /> {new Date(value).toLocaleDateString()}</Text>
        </Space>
      }
    },
    { // Chủ đề
      title: 'Chủ đề', dataIndex: 'ChuDe', key: 'ChuDe', ellipsis: true,
      render: (topic: string) => {
        return <Space orientation="vertical" size={0}>
          <Text ><ReadOutlined style={{ color: '#722ed1' }}
          /> {topic ?? `Chủ đề: chưa cập nhật...`} </Text>
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
        { text: 'Chưa chốt KQ', value: 'UNSUBMIT' }
      ], // value là của thằng filter
      onFilter: (value: any, session: SessionDB) => session.TrangThai === value,
      render: (value: string) => {
        const statusMap: Record<string, { color: string, text: string }> = {
          SCHEDULED: { color: 'default', text: 'Sắp tới' },
          COMPLETED: { color: 'success', text: 'Hoàn thành' },
          CANCELLED: { color: 'error', text: 'Đã hủy' },
          UNSUBMIT: { color: 'processing', text: 'Chưa chốt kết quả' }
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
      render: (adminMoKhoa: boolean, session: SessionDB) => {
        if (session.YeuCauMoKhoa)
          return <Tag color='orange'><InboxOutlined /> Yêu cầu mở</Tag>
        if (adminMoKhoa)
          return <Tag color='green'><UnlockOutlined /> Đang mở</Tag>
        else
          return <>---</>
      }
    },
    {// thao tác
      title: 'Thao tác', key: 'action', align: 'center' as const, width: 150,
      render: (value: SessionDB) => {
        return isAdmin ? <SessionAction
          session={value}
          unlock={handleUnlock}
          reload={initData}
          onCancel={handleCancel}
        />
          : <Tooltip title='Xem chi tiết'>
            <Button icon={<InfoCircleOutlined />} size="small" type="link"
              onClick={() => navigate(`sessions/${value.ID}`)} />
          </Tooltip>
      }
    }
  ]

  const AutoGenerate = async (lopHocId: number) => {
    try {
      const res = await sessionApi.generateAuto(lopHocId)
      initData()
      message.success(`Đã tạo thành công ${res.data.length} buổi học`)
    } catch (error: any) {
      CatchError.HandleError(error)
    }
  }

  const handleUnlock = async (sessionId: number) => {
    try {
      await sessionApi.unlock(sessionId)
      message.success('Thao tác thành công')
      initData()
    } catch (error) {
      CatchError.HandleError(error)
    }
  }

  const handleCancel = async (sessionId: number, reason: string) => {
    try {
      await sessionApi.cancel(sessionId, reason)
      message.success('Thao tác thành công')
      initData()
    } catch (error: any) {
      CatchError.HandleError(error)
    }
  }

  const changeTablePage = (pagination: any) =>
    setSearchParam({ tab: currentTab, page: pagination.current })

  if (loading)
    return <div style={{ minHeight: '89vh', background: '#f0f2f5' }}>
      <Skeleton loading={loading} active paragraph={{ rows: 6 }} />
    </div>

  if (!lophoc) return <div style={{ padding: 24, minHeight: '89vh', background: '#f0f2f5' }}>
    <Space orientation='vertical' size={3}>
      <Title level={4}>Không tìm thấy lớp học</Title>
      <Button onClick={() => navigate(-1)}>Quay lại</Button>
    </Space>
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
            <Button size="large" type="text" icon={<LeftOutlined />}
              onClick={() => navigate(-1)} />

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
              <Text type="secondary">Mã: {lophoc?.MaLopHoc}</Text>
            </div>
          </div>
          {/* là admin thì cho sửa */}
          {isAdmin && <><Tooltip title='Sửa lớp học'>
            <Button type="link" icon={<EditOutlined />}
              disabled={lophoc?.TrangThai === 'CLOSED' || lophoc?.TrangThai === 'FINISHED'}
              onClick={() => setOpenClassModal(true)}
            />
          </Tooltip>
            <ClassModal
              open={openClassModal}
              onCancel={() => setOpenClassModal(false)}
              onSave={(_) => initData()}
              khoahocId={lophoc.KhoaHocID}
              editingClass={lophoc}
            />
          </>}
        </div>
      </div>{/* kết thúc div của header */}

      {/* div của body */}
      <div style={{ padding: '0px 18px 0px 18px' }}>
        <Card>
          <Tabs
            onChange={(key) => setSearchParam({ tab: key })}
            activeKey={currentTab}
            tabBarExtraContent={ // 2 nút auto, manual
              isAdmin && <Space>
                <Popconfirm title="Xác nhận tạo buổi học tự động?"
                  description='Tạo tất cả buổi học phù hợp với lớp học'
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
                key: 'sessions',
                label: `Danh sách buổi học (${sessions.length})`,
                children: (
                  <Table style={{ marginTop: 8 }}
                    dataSource={sessions}
                    columns={columns}
                    pagination={{
                      current: currentPage,
                      pageSize: 12
                    }}
                    onChange={changeTablePage}
                    rowKey="ID"
                    scroll={{ y: 320 }}
                  />
                ),
              },
              {
                key: 'students',
                label: `Danh sách học viên`,
                children: (<TabStudent lophocId={lophoc.ID} />),
              },
              {
                key: 'info',
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