import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import type { ClassForStudent, StudentDB } from "./StudentDTO"
import { studentApi } from "../../api/studentApi"
import classApi from "../../api/classApi"
import {
  Avatar, Button, Card, Progress, Skeleton, Space, Table, Tabs, Tag, Tooltip, Typography
} from "antd"
import {
  CalendarFilled, CalendarOutlined, CaretLeftOutlined, ClockCircleFilled, EditOutlined, InfoCircleOutlined, LeftOutlined, ReadOutlined,
  UserOutlined,
} from "@ant-design/icons"
import StudentModal from "./StudentModal"
import TabInfo from "./TabInfo"
import { CatchError } from "../common/catch.error"
import TabInvoice from "./TabInvoice"

const { Text, Title } = Typography

const StudentDetail = () => {
  const { id } = useParams()
  const studentId = Number(id)
  const [student, setStudent] = useState<StudentDB | null>(null)
  const [classes, setClasses] = useState<ClassForStudent[]>([])
  const [openStudentModal, setopenStudentModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()


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
      CatchError.HandleError(error)
    }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!studentId || isNaN(studentId)) {
      console.log("id không phải số nên studentId lỗi!", studentId)
      setLoading(false)
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
    {// mã lớp 
      title: 'Mã lớp', dataIndex: 'MaLopHoc', key: 'MaLopHoc', width: 120,
      align: 'center' as const, render: (code: string) => (
        <Text code style={{ fontSize: 14 }}>{code}</Text>
      )
    },
    { // tên lớp
      title: 'Lớp', dataIndex: 'TenLop', key: 'TenLop', ellipsis: true,
      render: (name: string, lophoc: ClassForStudent) =>
        <Link to={`/admin/classes/${lophoc.ID}`} style={{ fontWeight: 'bold' }}>
          <ReadOutlined style={{ color: '#8c8c8c' }} /> {name}</Link>
    },
    { // giáo viên
      title: 'Giáo viên', dataIndex: 'GiaoVien', key: 'GiaoVien', ellipsis: true,
      render: (name: string) => <Text><UserOutlined style={{ color: '#8c8c8c' }} /> {name}</Text>
    },
    {// ngày nhập học
      title: 'Ngày nhập học', dataIndex: 'NgayGhiDanh', key: 'NgayGhiDanh',
      align: 'center' as const, render: (day: string) =>
        <Text><CalendarOutlined style={{ color: '#8c8c8c' }} /> {new Date(day).toLocaleDateString()}</Text>
    },
    // { // lịch học
    //   title: 'Lịch học', dataIndex: 'LichHoc', key: 'LichHoc', align: 'center' as const,
    //   render: (timeTable: number[], lophoc: ClassForStudent) => {
    //     const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    //     const result = timeTable.map(m => dow[m]).join('-')

    //     return <Space orientation="vertical" size={0}>
    //       <Text ><ClockCircleFilled /> {lophoc.GioHoc}</Text>
    //       <Text type="secondary"
    //         style={{ fontSize: '14px', display: 'block', textAlign: 'center' }}>
    //         {result}
    //       </Text>
    //     </Space>
    //   }
    // },
    { // tiến độ
      title: 'Tiến độ', dataIndex: 'BuoiDaHoc', key: 'BuoiDaHoc',
      render: (value: number, lophoc: ClassForStudent) => {
        if (lophoc.TrangThaiGD === 'INACTIVE')
          return <Text delete>Đã hủy ghi danh</Text>

        return <Space orientation="vertical" size={0}>
          <Text>{value}/{lophoc.TongSoBuoi} BH &nbsp;
            <Progress steps={4}
              strokeColor={'#52c41a'}
              percent={(value / lophoc.TongSoBuoi) * 100}
              showInfo={false}
            />
          </Text>
        </Space>
      }
    },
    {
      title: 'Thao tác', dataIndex: 'action', key: 'action', align: 'center' as const,
      render: (_: any, lophoc: ClassForStudent) =>
        <Tooltip title='Xem tiến độ'>
          <Button type="link"
            icon={<InfoCircleOutlined />} size="small"
            onClick={() => navigate(`classes/${lophoc.ID}`)} />
        </Tooltip>
    }
  ]

  if (loading)
    return <div style={{ minHeight: '89vh', background: '#f0f2f5' }}>
      <Skeleton loading={loading} active paragraph={{ rows: 6 }} />
    </div>

  if (!student) return <div style={{ padding: 24, minHeight: '89vh', background: '#f0f2f5' }}>
    <Space orientation='vertical' size={3}>
      <Title level={4}>Không tìm thấy học viên</Title>
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
        {/* Tiêu đề, avata */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* nút quay lại */}
            <Button size="large" type="text" icon={<LeftOutlined />}
              onClick={() => navigate(-1)} />

            <Avatar shape="square" size={49} style={{ background: '#0d6efd' }}>
              {student.MaHocVien.substring(0, 4)}
            </Avatar>

            <div>
              <Title level={3} style={{ margin: 0 }}>
                HV. {student.TenHocVien.toUpperCase()}
                <Tag color={status.color}
                  style={{ marginLeft: 10, verticalAlign: 'middle' }}>
                  {student.TrangThai}</Tag>
              </Title>

              <Text type="secondary">Mã: {student.MaHocVien}</Text>
            </div>
          </div>
          <Tooltip title='Sửa thông tin'>
            <Button type="link" icon={<EditOutlined />}
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
        <Card >
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: "1",
                label: 'Lớp ghi danh',
                children: (
                  <Table
                    dataSource={classes}
                    columns={columnsOfClass}
                    pagination={{ defaultPageSize: 5 }}
                    rowKey="ID"
                    scroll={{ y: 320 }}
                  />
                )
              },
              {
                key: '2',
                label: 'Hóa đơn',
                children: (<TabInvoice />)
              },
              {
                key: '3',
                label: 'Thông tin chung',
                children: (<TabInfo student={student} />)
              }
            ]}
          >
          </Tabs>
        </Card>
      </div>
    </div> // div của toàn bộ
  )
}

export default StudentDetail