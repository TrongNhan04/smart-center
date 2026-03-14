import { useEffect, useState } from 'react';
import {
  Card, Form, Input, Button, Upload, Table, Typography,
  Descriptions, Row, Col, Radio, Space, InputNumber, Tooltip, Tag,
  message, Popconfirm, notification
} from 'antd';
import {
  ArrowLeftOutlined,
  InboxOutlined, PhoneOutlined, SaveOutlined
} from '@ant-design/icons';
import type { SessionDetail, SessionResult } from '../session/SessionDTO';
import { DateHelper } from '../common/date.helper';
import { sessionApi } from '../../api/sessionApi';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography
const { TextArea } = Input
const { Dragger } = Upload

const SessionDetail = () => {
  const [form] = Form.useForm()
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<SessionDetail>()
  const [students, setStudents] = useState<SessionResult[]>([])
  const [fileURL, setFileURL] = useState<string[]>([])

  const sessionId = Number(id)
  const fetchSession = async () => {
    try {
      const res = await sessionApi.getDetailsById(sessionId)
      setSession(res.data)
      setStudents(res.data.ChiTietKetQua)
    } catch (error: any) {
      message.error('Có lỗi xảy ra')
      console.log("Có lỗi xảy ra: ", error?.response?.data?.message)
    }
  }

  useEffect(() => {
    if (sessionId)
      fetchSession()
  }, [sessionId])

  if (!session) return <div>Không tìm thấy buổi học</div>
  // Cấu hình cột cho Bảng Học Viên
  const columns = [
    { // số tt
      title: 'STT', key: 'stt', width: 60, align: 'center' as const,
      render: (_: any, __: any, index: any) => index + 1
    },
    { // mã học viên
      title: 'Mã HV', dataIndex: 'MaHocVien', key: 'MaHocVien', width: 100
    },
    { // tên học viên
      title: 'Tên Học Viên', dataIndex: 'TenHocVien', key: 'TenHocVien',
      width: 180, render: (text: string) => <Text strong>{text}</Text>
    },
    { // điểm danh
      title: 'Điểm danh', dataIndex: 'DiemDanh', key: 'DiemDanh', width: 280,
      render: (_: any, record: SessionResult) =>
        <Radio.Group
          value={record.DiemDanh}
          onChange={(e) => handleStudentChange(record.GhiDanhID, 'DiemDanh', e.target.value)}
        >
          <Radio value={true}><Tag color="success">Có mặt</Tag></Radio>
          <Radio value={false}><Tag color="error">Vắng</Tag></Radio>
        </Radio.Group>
    },
    {
      title: 'Điểm số', dataIndex: 'Diem', key: 'Diem', width: 100,
      render: (_: any, record: SessionResult) =>
        <InputNumber
          min={0} max={10}
          defaultValue={record.Diem}
          onChange={(val) => handleStudentChange(record.GhiDanhID, 'Diem', val)}
          placeholder="Điểm"
        />
    },
    {
      title: 'Nhận xét riêng', dataIndex: 'NhanXetRieng', key: 'NhanXetRieng',
      render: (_: any, record: SessionResult) =>
        <Input
          defaultValue={record.NhanXetRieng}
          placeholder="Nhập nhận xét..."
          onChange={(e) => handleStudentChange(record.GhiDanhID, 'NhanXetRieng', e.target.value)}
          allowClear
        />
    },
    {
      title: 'Phụ huynh', dataIndex: 'PhuHuynh', key: 'PhuHuynh', width: 150,
      render: (parent: string, record: SessionResult) =>
        <Tooltip title={`Gọi cho PH ${parent}`}>
          <Space style={{ cursor: 'pointer', color: '#1890ff' }}>
            <PhoneOutlined /> {record.DienThoai}
          </Space>
        </Tooltip>
    },
  ]

  const handelError = (error: any) => {
    notification.error({
      title: 'Có lỗi xảy ra',
      description: error?.response?.data?.message,
      showProgress: true,
      pauseOnHover: true
    })
    console.log('Có lỗi xảy ra: ', error?.response?.data?.message)
  }

  // Hàm cập nhật state khi giáo viên thao tác trên bảng
  const handleStudentChange = (id: number, field: string, value: any) => {
    const updatedStudents = students.map(stu =>
      stu.GhiDanhID === id ? { ...stu, [field]: value } : stu
    )
    setStudents(updatedStudents)
  }

  const handleSaveSession = async (type: 'DRAFT' | 'SUBMITTED') => {
    try {
      const formData = await form.validateFields()
      const payload = {
        ...formData,
        ChiTietKetQua: students.map(student => ({
          GhiDanhID: student.GhiDanhID,
          NhanXetRieng: student.NhanXetRieng,
          DiemDanh: student.DiemDanh,
          Diem: Number(student.Diem),
        }))
      }
      console.log(payload)
      console.log(fileURL)
      // const isSubmit = type === 'SUBMITTED'
      // isSubmit ? await sessionApi.submitted(sessionId, payload) :
      //   await sessionApi.saveDraft(sessionId, payload)
      // fetchSession()
      // message.success('Thao tác thành công')
    } catch (error) {
      handelError(error)
    }
  }

  const handleUpload = async (options: any) => {
    try {
      const { file, onSuccess } = options
      const formData = new FormData()
      formData.append('file', file)
      const res = await axios.post('http://localhost:3000/api/file-upload', formData)
      onSuccess('Ok')

      const resURL = res.data.data.secure_url
      setFileURL(prev=>[...prev, resURL])

      // message.success('')
    } catch (error) {
      options.onError({ error })
      handelError(error)
    }
  }

  const ngayHoc = new Date(session.BatDauLuc).toLocaleDateString()
  const gioHoc = DateHelper.ISOToHHMM(session.BatDauLuc, session.KetThucLuc)

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>

      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
        <Title level={3} style={{ margin: 0 }}>Báo cáo Buổi học</Title>

        <Space>
          <Button size="middle" icon={<SaveOutlined />} loading={loading}
            onClick={() => handleSaveSession('DRAFT')} > Lưu thông tin
          </Button>

          <Popconfirm
            title='Xác nhận chốt kết quả?'
            description='Kết quả sẽ được gửi thông báo đến phụ huynh'
            okText='Chốt kết quả'
            cancelText='Quay lại'
            onConfirm={() => handleSaveSession('SUBMITTED')}
          >
            <Button type="primary" size="middle" icon={<SaveOutlined />}
              loading={loading}> Chốt kết quả
            </Button>
          </Popconfirm>
        </Space>
      </Row>

      <Form form={form} layout="vertical"
        initialValues={session}
      >
        {/* Thông tin chung từ DB và nội dung buổi học */}
        <Card variant='borderless' title='Thông tin buổi học'
          style={{ marginBottom: 24, borderRadius: 8 }}
          styles={{
            header: { backgroundColor: '#f0f5ff', color: '#1d39c4' }
          }}>

          <Descriptions bordered size="small"
            style={{ marginBottom: 24 }} column={{ xs: 1, sm: 2, md: 3 }}>

            <Descriptions.Item label="Lớp">{session.LopHoc}</Descriptions.Item>

            <Descriptions.Item label="Buổi số">{session.BuoiSo}</Descriptions.Item>

            <Descriptions.Item label="Ngày học">{ngayHoc}</Descriptions.Item>

            <Descriptions.Item label="Thời gian">{gioHoc}</Descriptions.Item>

            <Descriptions.Item label="Phòng">{session.PhongHoc ?? '-'}</Descriptions.Item>

            <Descriptions.Item label="Giáo viên">{session.GiaoVien}</Descriptions.Item>
          </Descriptions>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item label="Chủ đề buổi học" name="ChuDe"
                rules={[{ required: true, message: 'Vui lòng nhập chủ đề!' }]}>
                <Input placeholder="Ví dụ: Unit 5 - Present Simple" size="large" />
              </Form.Item>
              <Form.Item label="Nội dung chi tiết" name="NoiDung">
                <TextArea rows={4} placeholder="Ghi chú chi tiết các phần đã dạy..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Bài tập về nhà " name="BaiTap">
                <TextArea rows={2} placeholder="Bài tập giao cho học viên..." />
              </Form.Item>
              <Form.Item label="Nhận xét chung về lớp" name="NhanXetChung"
                rules={[{ required: true, message: 'Vui lòng nhập nhận xét!' }]}>
                <TextArea rows={3} placeholder="Đánh giá tinh thần học tập chung của cả lớp..." />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* phần upload hình ảnh hoặc video */}
        <Card title="Video / Hình ảnh buổi học"
          variant='borderless' style={{ marginBottom: 24, borderRadius: 8 }}>
          <Form.Item name="file" noStyle
            valuePropName={"filelist"}
          >
            <Dragger multiple customRequest={handleUpload}
              listType="picture" style={{ padding: 20 }}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#1890ff', fontSize: 48 }} />
              </p>
              <p className="ant-upload-text">Kéo thả file vào đây hoặc nhấp để tải lên</p>
              <p className="ant-upload-hint">
                Hỗ trợ tải lên ảnh (JPG, PNG) hoặc video ngắn (MP4) quay lại hoạt động của lớp.
              </p>
            </Dragger>
          </Form.Item>
        </Card>

        {/* điểm danh và nhận xét cá nhân */}
        <Card
          title="Danh sách học viên"
          variant='borderless'
          style={{ borderRadius: 8 }}
          styles={{
            header: { backgroundColor: '#f0f5ff', color: '#1d39c4' }
          }}
        >
          <Table
            columns={columns}
            dataSource={students}
            rowKey="GhiDanhID"
            pagination={false}
            scroll={{ x: 1000 }}
          />
        </Card>
      </Form>
    </div>
  )
}

export default SessionDetail