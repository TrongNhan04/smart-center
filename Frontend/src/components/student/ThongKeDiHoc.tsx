import {
  Button, Card, Descriptions, Divider, Skeleton, Space, Table, Tag, Typography
} from "antd"
import type { ClassResult, Result } from "./StudentDTO"
import {
  CalendarOutlined, CheckCircleFilled, ClockCircleOutlined, CloseCircleFilled,
  CommentOutlined, EnvironmentOutlined, ReadOutlined, UserOutlined
} from "@ant-design/icons"
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
    { // chủ đề
      title: 'Chủ đề', dataIndex: 'ChuDe', key: 'ChuDe', ellipsis: true,
      render: (value: string) => {
        return <Space orientation="vertical" size={0}><Text>
          <ReadOutlined style={{ color: '#722ed1' }} /> {value ?? 'Chưa cập nhật...'}</Text>
        </Space>
      }
    },
    { // Thời gian
      title: 'Thời gian', dataIndex: 'BatDauLuc', width: 140,
      key: 'BatDauLuc', align: 'center' as const,//ellipsis: 
      render: (value: string) => {
        return <Space orientation="vertical" size={0}>
          <Text >
            <CalendarOutlined style={{ color: '#187cff' }} /> {new Date(value).toLocaleDateString()}
          </Text>
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
      title: 'Nhận xét', dataIndex: 'NhanXet', key: 'NhanXet',
      render: (value: string) => <Text ellipsis={{tooltip:value}}>
        <CommentOutlined style={{ color: '#8c8c8c' }} /> {value}
      </Text>
    },
    {// điểm
      title: 'Điểm', dataIndex: 'Diem', key: 'Diem', width: 100,
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
    <div style={{ padding: 16, background: '#f0f2f5', minHeight: '91vh' }}>

      <Card variant='borderless' title={`Kết quả học viên: ${classResult.HocVien}`}
        style={{ marginBottom: 24, borderRadius: 8 }}
        extra={
          <Button
            onClick={() => navigate(-1)}>
            Quay lại</Button>}
        styles={{
          header: { backgroundColor: '#f0f5ff', color: '#1d39c4' }
        }}>
        <Descriptions size="small" column={3}>
          <Descriptions.Item label="Lớp">
            <Text>
              <ReadOutlined style={{ color: '#8c8c8c' }} /> {classResult.LopHoc}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label="Có mặt">
            <Text strong style={{ color: '#52c41a' }}>
              {present} buổi <CheckCircleFilled />
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label="Thời gian">
            <Text>
              <ClockCircleOutlined style={{ color: '#8c8c8c' }} /> {classResult.GioHoc}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label="Giáo viên">
            <Text>
              <UserOutlined style={{ color: '#8c8c8c' }} /> {classResult.GiaoVien}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label="Vắng mặt">
            <Text strong type="danger">
              {absent} buổi <CloseCircleFilled />
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label="Phòng">
            <Text>
              <EnvironmentOutlined
                style={{ color: '#8c8c8c' }} /> {classResult.PhongHoc ?? '_'}
            </Text>
          </Descriptions.Item>
        </Descriptions>
        <Divider />

        <Table
          columns={columnsOfSS}
          dataSource={classResult.KetQua}
          pagination={{ pageSize: 12 }}
          rowKey='ID'
          scroll={{ y: 320 }}
        />
      </Card>
    </div>
  )
}

export default ThongKeDiHoc