import {
  BookOutlined, CalendarOutlined, ClockCircleOutlined,
  EditOutlined, HomeOutlined, InboxOutlined, LockOutlined,
  PlusOutlined, TeamOutlined, UnlockOutlined, UserOutlined
}
  from "@ant-design/icons"
import {
  Avatar, Badge, Breadcrumb, Button, Card, Col, Descriptions,
  message, Row, Space, Statistic, Table, Tabs, Tag, Tooltip, Typography
} from "antd"
import { Link, useParams } from "react-router-dom"
import type { ClassDB } from "./ClassDTO"
import { useEffect, useState } from "react"
import classApi from "../../api/classApi"
import { sessionApi } from "../../api/sessionApi"
import type { SessionDB } from "../session/SessionDTO"
import { DateHelper } from "./date.helper"

const { Title, Text } = Typography

const ClassDetail = () => {
  const { id } = useParams()
  const classId = Number(id)
  const [lophoc, setLopHoc] = useState<ClassDB | null>(null)
  const [sessions, setSessions] = useState<SessionDB[]>([])
  // const [openClassModal, setOpenClassModal] = useState(false)

  const fetchClass = async () => {
    try {
      const res = await classApi.findOne(classId)
      setLopHoc(res.data)
      console.log("res của class: ", res)
    } catch (error: any) {
      message.error("Có lỗi xảy ra!")
      console.log("Có lỗi hàm fetchClass: ", error)
    }
  }

  const fetchSessions = async () => {
    try {
      const res = await sessionApi.getSessionOfClass(classId)
      setSessions(res.data)
      console.log("res của ss: ", res)
    } catch (error) {
      message.error("Có lỗi xảy ra!")
      console.log("Có lỗi hàm fetchSessions: ", error)
    }
  }

  useEffect(() => {
    const initData = async () => {
      try {
        await Promise.all([
          fetchClass(), fetchSessions()
        ])
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

  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  const result = lophoc?.LichHoc.map(m => dow[m]).join('-')

  // const SaveClassModal = (id: number) => {
  //   setClassId(id)
  //   fetchClasses()
  //   setTimeout(() => {
  //     setClassId(null)
  //   }, 3000);
  // }

  if (!lophoc)
    return <div>Không tìm thấy lớp học</div>

  const statusColor: Record<string, string> = {
    OPEN: 'default',
    RUNNING: 'success',
    CLOSED: 'error',
  }
  const status = statusColor[lophoc.TrangThai]

  const columns = [
    {// Buổi số
      title: 'Buổi số', dataIndex: 'BuoiSo', width: 90,
      key: 'BuoiSo', align: 'center' as const,
      render: (value: number) => value
    },
    { // Thời gian
      title: 'Thời gian', dataIndex: 'BatDauLuc', width:130,
      key: 'BatDauLuc', //ellipsis: 
      render: (value: string, session: SessionDB) => {
        return <Space orientation="vertical" size={0}>
          <Text strong>
            <CalendarOutlined /> {new Date(value).toLocaleDateString()}
          </Text>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            <ClockCircleOutlined /> {DateHelper.ISOToHHMM(new Date(value),
              new Date(session.KetThucLuc))}
          </Text>
        </Space>
      }
    },
    { // Nội dung
      title: 'Nội dung', dataIndex: 'ChuDe', key: 'ChuDe', //width: 130,
      render: (topic: string, session: SessionDB) => {
        return <Space orientation="vertical" size={0}>
          <Text strong>{topic}</Text>

          <Text type="secondary" style={{ fontSize: '14px' }}>
            {session.PhongHoc ?? `Chưa cập nhật`}
          </Text>
        </Space>
      }
    },
    { // trạng thái
      title: 'Trạng thái', dataIndex: 'TrangThai', key: 'TrangThai', width:130,
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
      title: 'Tình trạng khóa', dataIndex: 'AdminMoKhoa', 
      key: 'AdminMoKhoa', align:'center' as const,
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
          return <Tag color='default'><LockOutlined /> Đã khóa</Tag>
      }
    },
    {
      title: 'Thao tác', key: 'action',
    }
  ]

  return (
    // div này bọc toàn bộ nội dung trang chi tiết
    <div style={{ minHeight: 'calc(100vh - 64px)', background: '#f0f2f5' }}>
      {/* Phần HEADER */}
      <div style={{ background: '#fff', padding: '16px 24px', borderBlock: '1px solid #e8e8e8' }}>
        {/* Thanh bánh mì */}
        <Breadcrumb items={[
          { title: <Link to='/admin/home'><HomeOutlined /></Link> },
          { title: <Link to='/admin/classes'>Lớp học</Link> },
          { title: `${lophoc.TenLop}` }
        ]} />

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

              <Text type="secondary">Mã: {lophoc.MaLopHoc}</Text>
            </div>
          </div>
          <Tooltip title='Sửa lớp học'>
            <Button type="primary" ghost icon={<EditOutlined />}
            //onClick={() => { setOpenCourseModal(true) }}
            />
          </Tooltip>
        </div>
        {/* <CourseModal
          open={openCourseModal}
          onCancel={() => { setOpenCourseModal(false) }}
          onSave={fetchCourse}//Nếu bên trong Modal gọi onSave(105), 
          // thì hàm cha sẽ nhận được fetchCourse(105)
          editingCourse={course}
        /> */}
      </div>{/*  div của header */}

      {/* div của body */}
      <div style={{ padding: '24px' }}>
        <Row gutter={24}>
          {/* cột trái: bảng buổi học và mô tả */}
          <Col span={18}>
            <Card>
              <Tabs
                defaultActiveKey="1"
                tabBarExtraContent={
                  <Space>
                    <Button //type="dashed"
                      icon={<PlusOutlined />}
                    //onClick={() => setOpenClassModal(true)}
                    >Tự động
                    </Button>
                    <Button //type="dashed"
                      icon={<PlusOutlined />}
                    //onClick={() => setOpenClassModal(true)}
                    >Thủ công
                    </Button>
                  </Space>
                }
                items={[
                  {
                    key: '1',
                    label: `Danh sách buổi học (${sessions.length})`,
                    children: (
                      <Table style={{ marginTop: 8 }}
                        dataSource={sessions}
                        columns={columns}
                        pagination={{ defaultPageSize: 5 }}
                        rowKey="ID"
                        scroll={{ y: 290 }}
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
            {/* <ClassModal
              open={openClassModal}
              onCancel={() => setOpenClassModal(false)}
              khoahocId={Number(id)}
              onSave={SaveClassModal}
              editingClass={null!}
            /> */}
          </Col>

          {/* Cột phải: chứa thông tin tổng quan */}
          <Col span={6}>
            {/* thông tin tổng quan  */}
            <Card title="Thông tin chung" style={{ marginBottom: 24 }}>
              <Descriptions column={1} size='small' colon={false} layout="horizontal" items={[
                {
                  label: <><span style={{ color: '#888' }}>
                    <BookOutlined /> Khóa học: &nbsp;
                    <Text strong>{lophoc.KhoaHoc.TenKhoaHoc}</Text>
                  </span></>
                },
                {
                  label: <><span style={{ color: '#888' }}>
                    <UserOutlined /> Giáo viên: &nbsp;
                    <Text strong>{lophoc.GiaoVien.HoTen}</Text>
                  </span></>
                },
                {
                  label: <><span style={{ color: '#888' }}>
                    <CalendarOutlined /> Khai giảng: &nbsp;
                    <Text strong>
                      {new Date(lophoc.TuNgay).toLocaleDateString()}</Text>
                  </span> </>
                },
                {
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
              <Row gutter={16}>
                {/* <Col span={12}>
                  <Statistic
                    title="Lớp đang mở"
                    value={openningClass.length}
                    prefix={<ReadOutlined />}
                  />
                </Col> */}

                {/* <Col span={12}> */}
                <Statistic
                  title="Tống học viên ghi danh"
                  value={`${lophoc.TongGhiDanh}/${lophoc.SiSo}`}
                  prefix={<TeamOutlined />}
                // valueStyle={{ color: '#3f8600' }}
                />
                {/* </Col> */}
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default ClassDetail