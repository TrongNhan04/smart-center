import {
  Button, Card, Descriptions, Divider, Skeleton, Space, Table, Tag, Typography
} from "antd"
import type { ClassResult, Result } from "./StudentDTO"
import { CalendarFilled, CheckCircleFilled, ClockCircleFilled, CloseCircleFilled, EnvironmentFilled, ReadFilled, ReadOutlined } from "@ant-design/icons"
import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { studentApi } from "../../api/studentApi"
import { CatchError } from "../common/catch.error"

const { Text, Title } = Typography

const ThongKeDiHoc = () => {
  const { studentId, classId } = useParams()
  const navigate = useNavigate()
  const [classResult, SetclassResult] = useState<ClassResult>()
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await studentApi.getClassResultById
        (Number(studentId), Number(classId))
      SetclassResult(res.data)
    } catch (error) {
      CatchError.HandleError(error)
    }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const columnsOfSS = [
    {// Buổi số
      title: 'Buổi', dataIndex: 'BuoiSo', width: 100,
      key: 'BuoiSo', align: 'center' as const,
    },
    {
      title: 'Nội dung', dataIndex: 'ChuDe', key: 'ChuDe', ellipsis: true,
      render: (value: string) => {
        //const className = classes.find(item => item.ID === session.LopHocID)
        return <Space orientation="vertical" size={0}>
          <Text><ReadFilled style={{ color: '#188bff' }} /> Chủ đề: {value ?? 'Chưa cập nhật...'}</Text>
          {/* <Text><EnvironmentOutlined /> Phòng học: {result.PhongHoc ?? 'Chưa cập nhật...'}</Text> */}
        </Space>
      }
    },
    { // Thời gian
      title: 'Thời gian', dataIndex: 'BatDauLuc', width: 160,
      key: 'BatDauLuc', align: 'center' as const,//ellipsis: 
      render: (value: string) => {
        return <Space orientation="vertical" size={0}>
          <Text >
            <CalendarFilled style={{ color: 'orange' }} /> {new Date(value).toLocaleDateString()}
          </Text>
          {/* <Text type="secondary" style={{ fontSize: '14px' }}>
            <ClockCircleOutlined /> {result.GioHoc}
          </Text> */}
        </Space>
      }
    },

    { // điểm danh
      title: 'Điểm danh', dataIndex: 'DiemDanh', key: 'DiemDanh',
      width: 160, align: 'center' as const,
      filters: [
        { text: 'Có mặt', value: true },
        { text: 'Vắng mặt', value: false }
      ],
      onFilter: (value: any, result: Result) =>
        result.DiemDanh === value,
      render: (value: boolean) => {
        if (value) return <Tag color='green'>Có mặt</Tag>
        return <Tag color='error'>Vắng mặt</Tag>
      }
    },
    {// nhận xét
      title: 'Nhận xét', dataIndex: 'NhanXet', key: 'NhanXet', ellipsis: true
    },
    {// điểm
      title: 'Điểm', dataIndex: 'Diem', key: 'Diem', width: 160,
      align: 'center' as const,
      render: (value: number) => value ?? '-'
    }
  ]

  if (loading)
    return <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <Skeleton loading={loading} active paragraph={{ rows: 6 }} />
    </div>

  if (!classResult) return <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
    <Space orientation='vertical' size={3}>
      <Title level={4}>Không tìm thấy kết quả học viên</Title>
      <Button onClick={() => navigate(-1)}>Quay lại</Button>
    </Space>
  </div>

  let present = 0
  let absent = 0
  for (const item of classResult.KetQua) {
    if (item.DiemDanh)
      present += 1
    else
      absent += 1
  }
  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>

      <Card variant='borderless' title='Kết quả học tập'
        style={{ marginBottom: 24, borderRadius: 8 }}
        extra={
          <Button
            // style={:{}}
            onClick={() => navigate(-1)}>
            Quay lại</Button>}
        styles={{
          header: { backgroundColor: '#f0f5ff', color: '#1d39c4' }
        }}>
        <Descriptions size="small"
          style={{ marginBottom: 24 }} column={2}
          styles={{ label: { color: 'black' } }}>
          <Descriptions.Item label="Lớp">
            <Text strong style={{ color: '#1677ff' }}>
              <ReadOutlined /> {classResult.LopHoc}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Giáo viên">{classResult.GiaoVien}</Descriptions.Item>
          <Descriptions.Item label="Phòng">
            <Text>
              <EnvironmentFilled style={{ color: '#ff4d4f' }} /> {classResult.PhongHoc ?? '_'}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian">
            <Text><ClockCircleFilled /> {classResult.GioHoc}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Có mặt">
            <Text strong style={{ color: '#52c41a' }}>
              {present} buổi <CheckCircleFilled /></Text>
          </Descriptions.Item>
          <Descriptions.Item label="Vắng mặt">
            <Text strong type="danger">{absent} buổi <CloseCircleFilled /></Text>
          </Descriptions.Item>
          <Descriptions.Item label="Học viên">
            <Text strong >{classResult.HocVien}</Text>
          </Descriptions.Item>
        </Descriptions>
        <Divider />

        <Table
          columns={columnsOfSS}
          dataSource={classResult.KetQua}
          pagination={{ pageSize: 12 }}
          rowKey={'ID'}
        />
      </Card>
    </div>
  )
}

export default ThongKeDiHoc