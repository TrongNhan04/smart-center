import { Button, Card, Descriptions, Divider, notification, Space, Table, Tag, Typography } from "antd"
import type { ClassResult, Result } from "./StudentDTO"
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, ReadOutlined } from "@ant-design/icons"
import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { studentApi } from "../../api/studentApi"

const { Text } = Typography

const ThongKeDiHoc = () => {
  const { studentId, classId } = useParams()
  const navigate = useNavigate()
  const [classResult, SetclassResult] = useState<ClassResult>()

  const handleError = (error: any) => {
    notification.error({
      title: 'Có lỗi xảy ra',
      description: error?.response?.data?.message,
      showProgress: true,
      pauseOnHover: true
    })
    console.log(error)
  }

  const fetchData = async () => {
    try {
      const res = await studentApi.getClassResultById
        (Number(studentId), Number(classId))
      SetclassResult(res.data)
    } catch (error) {
      handleError(error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (!classResult) return <div>Không tìm thấy lớp học</div>

  let present = 0
  let absent = 0
  for (const item of classResult?.KetQua!) {
    if (item.DiemDanh)
      present += 1
    else
      absent += 1
  }
  const columnsOfSS = [
    {// Buổi số
      title: 'Buổi', dataIndex: 'BuoiSo', width: 100,
      key: 'BuoiSo', align: 'center' as const,
    },
    {
      title: 'Nội dung', dataIndex: 'ChuDe', key: 'ChuDe', ellipsis: true,
      render: (value: string, result: Result) => {
        //const className = classes.find(item => item.ID === session.LopHocID)
        return <Space orientation="vertical" size={0}>
          <Text><ReadOutlined /> Chủ đề: {value ?? 'Chưa cập nhật...'}</Text>
          <Text><EnvironmentOutlined /> Phòng học: {result.PhongHoc ?? 'Chưa cập nhật...'}</Text>
        </Space>
      }
    },
    { // Thời gian
      title: 'Thời gian', dataIndex: 'BatDauLuc', width: 160,
      key: 'BatDauLuc', align: 'center' as const,//ellipsis: 
      render: (value: string, result: Result) => {
        return <Space orientation="vertical" size={0}>
          <Text strong>
            <CalendarOutlined /> {new Date(value).toLocaleDateString()}
          </Text>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            <ClockCircleOutlined /> {result.GioHoc}
          </Text>
        </Space>
      }
    },

    { // điểm danh
      title: 'Điểm danh', dataIndex: 'DiemDanh', key: 'DiemDanh', width: 160,
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

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <Button onClick={() => navigate(`/admin/students/${studentId}`)}>Quay lại</Button>
      <Card variant='borderless' title='Kết quả học tập'
        style={{ marginTop: 18, marginBottom: 24, borderRadius: 8 }}
        styles={{
          header: { backgroundColor: '#f0f5ff', color: '#1d39c4' }
        }}>
        <Descriptions bordered size="small"
          style={{ marginBottom: 24 }} column={2}>
          <Descriptions.Item label="Lớp">{classResult.LopHoc}</Descriptions.Item>
          <Descriptions.Item label="Giáo viên">{classResult.GiaoVien}</Descriptions.Item>
          <Descriptions.Item label="Có mặt">
            <Text strong style={{ color: '#0d6efd' }}>{present} buổi</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Vắng mặt">
            <Text strong type="danger">{absent} buổi</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Học viên">
            <Text strong >{classResult.HocVien}</Text>
          </Descriptions.Item>
        </Descriptions>
        <Divider />


        <Table
          columns={columnsOfSS}
          dataSource={classResult.KetQua}
          pagination={{pageSize:12}}
        />
      </Card>
    </div>
  )
}

export default ThongKeDiHoc