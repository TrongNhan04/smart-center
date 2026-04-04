import { Button, Card, Descriptions, Divider, notification, Skeleton, Space, Table, Tag, Typography } from "antd"
import type { ClassResult, Result } from "./StudentDTO"
import { CalendarFilled, CalendarOutlined, CheckCircleFilled, ClockCircleOutlined, CloseCircleFilled, EnvironmentOutlined, ReadFilled, ReadOutlined } from "@ant-design/icons"
import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { studentApi } from "../../api/studentApi"

const { Text, Title } = Typography

const ThongKeDiHoc = () => {
  const { studentId, classId } = useParams()
  const navigate = useNavigate()
  const [classResult, SetclassResult] = useState<ClassResult>()
  const [loading, setLoading] = useState(true)

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
      setLoading(true)
      const res = await studentApi.getClassResultById
        (Number(studentId), Number(classId))
      SetclassResult(res.data)
    } catch (error) {
      handleError(error)
    }
    finally{setLoading(false)}
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
          <Text><ReadFilled style={{color:'#188bff'}}/> Chủ đề: {value ?? 'Chưa cập nhật...'}</Text>
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
            <CalendarFilled style={{color:'orange'}}/> {new Date(value).toLocaleDateString()}
          </Text>
          {/* <Text type="secondary" style={{ fontSize: '14px' }}>
            <ClockCircleOutlined /> {result.GioHoc}
          </Text> */}
        </Space>
      }
    },

    { // điểm danh
      title: 'Điểm danh', dataIndex: 'DiemDanh', key: 'DiemDanh', 
      width: 160, align:'center' as const,
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
            <Text strong style={{ color: '#0d6efd' }}>
              {present} buổi <CheckCircleFilled/></Text>
          </Descriptions.Item>
          <Descriptions.Item label="Vắng mặt">
            <Text strong type="danger">{absent} buổi <CloseCircleFilled/></Text>
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
          rowKey={'ID'}
        />
      </Card>
    </div>
  )
}

export default ThongKeDiHoc