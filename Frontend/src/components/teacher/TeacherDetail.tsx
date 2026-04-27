import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import type { TeacherDB } from "./TeacherDTO"
import type { TeacherClass } from "../class/ClassDTO"
import teacherApi from "../../api/teacherApi"
import {
  Avatar, Button, Card, Progress, Skeleton, Space, Table, Tabs, Tag, Tooltip, Typography
} from "antd"
import classApi from "../../api/classApi"
import {
  CalendarOutlined, ClockCircleOutlined, EditOutlined, InfoCircleOutlined,
  LeftOutlined, ReadOutlined, ScheduleOutlined,
} from "@ant-design/icons"
import TeacherModal from "./TeacherModal"
import { CatchError } from "../common/catch.error"
import TabInfo from "./TabInfo"
const { Text, Title } = Typography

const TeacherDetail = () => {
  const { id } = useParams()
  const [teacher, setTeacher] = useState<TeacherDB | null>(null)
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [openTeacherModal, setOpenTeacherModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const teacherId = Number(id)
  const navigate = useNavigate() // làm nút quay lại

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
      CatchError.HandleError(error)
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!teacherId || isNaN(teacherId)) {
      console.log("id không phải số nên teacherId lỗi!", teacherId)
      setLoading(false)
      return
    }
    initData()
  }, [teacherId])

  const statusColor: Record<string, { color?: string, text?: string }> = {
    ACTIVE: { color: 'green', text: 'Đang hoạt động' },
    INACTIVE: { color: 'error', text: 'Ngừng hoạt động' }
  }
  const status = teacher ? statusColor[teacher.TrangThai] : { color: 'default', text: '' }

  const columnsOfClass = [
    {// mã lớp 
      title: 'Mã lớp', dataIndex: 'MaLopHoc', key: 'MaLopHoc', width: 120,
      align: 'center' as const, render: (code: string) =>
        <Text code style={{ fontSize: 14 }}>{code}</Text>
    },
    { // tên lớp
      title: 'Lớp', dataIndex: 'TenLop', key: 'TenLop', ellipsis: true,
      render: (name: string, lophoc: TeacherClass) => <>
        <ReadOutlined style={{ color: '#8c8c8c' }} />
        <Link to={`/admin/classes/${lophoc.ID}`}
          style={{ fontWeight: 'bold' }}> {name}
        </Link>
      </>
    },
    { // khai giảng = ngày bắt đầu
      title: 'Khai giảng', dataIndex: 'TuNgay', key: 'TuNgay',
      render: (day: string) => <Text>
        <CalendarOutlined style={{ color: '#8c8c8c' }} /> {new Date(day).toLocaleDateString()}</Text>
    },
    { // lịch học
      title: 'Lịch học', dataIndex: 'LichHoc', key: 'LichHoc',
      render: (timeTable: number[]) => {
        const dow = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
        const result = timeTable.map(m => dow[m]).join(', ')
        return <Text ><ScheduleOutlined style={{ color: '#8c8c8c' }} /> {result}</Text>
      }
    },
    {// giờ học 
      title: 'Giờ học', dataIndex: 'GioHoc', key: 'GioHoc',
      render: (time: string) => <Text>
        <ClockCircleOutlined style={{ color: '#fa8c16' }} /> {time}</Text>
    },
    { // Tiến độ
      title: 'Tiến độ', dataIndex: 'SoBuoiDaHoc', key: 'SoBuoiDaHoc',
      render: (bdh: number, lophoc: TeacherClass) => {
        const percent = (bdh / lophoc.TongSoBuoi) * 100
        let percentColor = '#ff4d4f' // đỏ
        if (percent > 50) percentColor = '#faad14' //vàng
        if (percent > 80) percentColor = '#52c41a'
        return <Space>

          <Text>{bdh}/{lophoc.TongSoBuoi} BH </Text>
          <Progress
            steps={5}
            percent={percent}
            //percent={}
            showInfo={false}
            strokeColor={percentColor}
          />

        </Space>
      }
    },
    { //xem chi tiết
      title: 'Thao tác', dataIndex: 'ChiTiet', key: 'ChiTiet', width: 130,
      align: 'center' as const,
      render: (_: any, lophoc: TeacherClass) =>
        <Tooltip title='Chi tiết tiến độ'>
          <Button type="link" size="small"
            icon={<InfoCircleOutlined />}
            onClick={() =>
              navigate(`/admin/classes/${lophoc.ID}/sessions/${lophoc.IDBuoiDau}`)} />
        </Tooltip>
    },
  ]

  if (loading)
    return <div style={{ minHeight: '89vh', background: '#f0f2f5' }}>
      <Skeleton loading={loading} active paragraph={{ rows: 6 }} />
    </div>

  if (!teacher) return <div style={{ padding: 24, minHeight: '89vh', background: '#f0f2f5' }}>
    <Space orientation='vertical' size={3}>
      <Title level={4}>Không tìm thấy giáo viên</Title>
      <Button onClick={() => navigate(-1)}>Quay lại</Button>
    </Space>
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
              <Button size="large" type="text" icon={<LeftOutlined />}
                onClick={() => navigate(-1)} />

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

                <Text type="secondary">Mã: {teacher?.MaGiaoVien}</Text>
              </div>
            </div>
            <Tooltip title='Sửa thông tin'>
              <Button type="link" icon={<EditOutlined />}
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
                  label: `Thông tin chung`,
                  children: (<TabInfo teacher={teacher} />),
                }
              ]} /> {/* kết thúc tab */}
          </Card>
        </div>
      </div>
    </Skeleton>
  )
}

export default TeacherDetail