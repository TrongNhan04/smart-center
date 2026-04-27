import { useEffect, useState } from 'react';
import {
  Card, Form, Input, Button, Upload, Table, Typography, Descriptions,
  Row, Col, Radio, Space, InputNumber, Tooltip, Tag, message, Skeleton,
} from 'antd';
import {
  CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, InboxOutlined,
  LeftOutlined, ReadOutlined, UserOutlined,
} from '@ant-design/icons';
import type { SessionResult, TSessionDetail } from '../session/SessionDTO';
import { DateHelper } from '../common/date.helper';
import { sessionApi } from '../../api/sessionApi';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import FileUpload from './FileUpload';
import { useAuthStore } from '../../store/useAuthStore';
import UnlockButton from './UnlockButton'
import NavigateDrawer from './NavigateDrawer';
import { CatchError } from '../common/catch.error';

const { Title, Text } = Typography
const { TextArea } = Input
const { Dragger } = Upload

type trangThai = 'done' | 'uploading' | 'error' | 'removed'

interface fileFormat {
  uid: string,
  name: string,
  status: trangThai,
  public_id: string,
  url: string,
  resource_type: string
}

const SessionDetail = () => {
  const [form] = Form.useForm()
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState<TSessionDetail>()
  const [students, setStudents] = useState<SessionResult[]>([])
  const [fileList, setFileList] = useState<fileFormat[]>([])
  const [reload, setReload] = useState(0)// để con là bộ sưu tập biết mà tải lại
  const [openDrawer, setOpenDrawer] = useState(false)
  const [loading, setLoading] = useState(true)
  const isAdmin = useAuthStore(state => state.user?.role) === 'ADMIN'
  const buoiHocId = Number(sessionId)
  const fetchSession = async (id: number) => {
    try {
      setLoading(true)
      const res = await sessionApi.getDetailsById(id)
      setSession(res.data)
      setStudents(res.data.ChiTietKetQua)
    } catch (error: any) {
      CatchError.HandleError(error)
    }
    finally { setLoading(false) }
  }

  // useEffect 1: id thay đổi thì fetch id mới
  useEffect(() => {
    if (!buoiHocId) {
      setLoading(false)
      return
    }
    fetchSession(buoiHocId)
    // form.setFieldsValue(session) ở đây thì chạy lần đầu không có dữ liệu
    // vì fetchSession async chạy chưa xong thì đã set form value
  }, [buoiHocId])
  // useEffect 2: session thay đổi thì đổ dữ liệu mới vào form
  useEffect(() => {
    if (session)
      form.setFieldsValue(session)
  }, [session, form])

  // Cấu hình cột cho Bảng Học Viên
  const columns = [
    { // số tt
      title: 'STT', key: 'stt', width: 80, align: 'center' as const,
      render: (_: any, __: any, index: any) => index + 1
    },
    { // mã học viên
      title: 'Mã HV', dataIndex: 'MaHocVien', key: 'MaHocVien', width: 120
    },
    { // tên học viên
      title: 'Họ và tên', dataIndex: 'TenHocVien', key: 'TenHocVien',
      render: (text: string, record: SessionResult) =>
        <Tooltip title={<>Ph. {record.PhuHuynh} <br/> ĐT. {record.DienThoai}</>}>
          <Space style={{ cursor: 'pointer' }}>
            <UserOutlined style={{ color: '#8c8c8c' }} />{text}
          </Space>
        </Tooltip>
    },
    { // điểm danh
      title: 'Điểm danh', dataIndex: 'DiemDanh', key: 'DiemDanh', width: 220,
      render: (_: any, record: SessionResult) =>
        <Radio.Group
          value={record.DiemDanh}
          onChange={(e) => handleStudentChange(record.GhiDanhID, 'DiemDanh', e.target.value)}
        >
          <Radio value={true}><Tag color="success">Có mặt</Tag></Radio>
          <Radio value={false}><Tag color="error">Vắng</Tag></Radio>
        </Radio.Group>
    },
    {// điểm số
      title: 'Điểm số', dataIndex: 'Diem', key: 'Diem', width: 100,
      render: (value: any, record: SessionResult) =>
        <InputNumber
          value={value}
          min={0} max={10}
          defaultValue={record.Diem}
          onChange={(val) => handleStudentChange(record.GhiDanhID, 'Diem', val)}
          placeholder="Điểm"
        />
    },
    {// nhận xét riêng
      title: 'Nhận xét riêng', dataIndex: 'NhanXetRieng', key: 'NhanXetRieng',
      render: (value: any, record: SessionResult) =>
        <Input
          value={value}
          placeholder="Nhập nhận xét..."
          onChange={(e) => handleStudentChange(record.GhiDanhID, 'NhanXetRieng', e.target.value)}
          allowClear
        />
    },
  ]

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
        TepDinhKem: fileList,
        ChiTietKetQua: students.map(student => ({
          GhiDanhID: student.GhiDanhID,
          NhanXetRieng: student.NhanXetRieng,
          DiemDanh: student.DiemDanh,
          Diem: student.Diem ? Number(student.Diem) : null,
        }))
      }
      const isSubmit = type === 'SUBMITTED'
      isSubmit ? await sessionApi.submitted(buoiHocId, payload) :
        await sessionApi.saveDraft(buoiHocId, payload)
      fetchSession(buoiHocId)
      message.success('Thao tác thành công')
      setReload(prev => prev + 1)// tăng lên để con biết reload
    } catch (error) {
      CatchError.HandleError(error)
    }
  }

  const handleUpload = async (options: any) => {
    try {
      const { file, onSuccess } = options
      const formData = new FormData()
      formData.append('file', file)
      const token = useAuthStore.getState().access_token
      const res = await axios.post('http://localhost:3000/api/file-upload',
        formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      onSuccess(res.data.data, file)
      const resFile = {
        uid: file.uid,
        name: '',
        status: 'done' as trangThai,
        public_id: res.data.data.public_id,
        url: res.data.data.url,
        resource_type: res.data.data.resource_type
      }
      setFileList(prev => [...prev, resFile])
    } catch (error) {
      options.onError({ error })
      CatchError.HandleError(error)
    }
  }

  const handleGetOldFile = (oldFile: any) => {
    setFileList(oldFile) // lưu vào status để đưa cho backend
    form.setFieldValue('file', oldFile) // đưa cho form để hiển thị
  }

  const handleRemoveFile = (file: any) => {
    // chỉ giữ những thằng khác id của file
    const newFileList = fileList.filter(item => item.uid !== file.uid)
    setFileList(newFileList)
  }

  if (loading)
    return <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <Skeleton loading={loading} active paragraph={{ rows: 6 }} />
    </div>

  if (!session)
    return <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <Space orientation='vertical' size={3}>
        <Text>Không tìm thấy buổi học</Text>
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
      </Space>
    </div>

  const ngayHoc = new Date(session.BatDauLuc).toLocaleDateString()
  const gioHoc = DateHelper.ISOToHHMM(session.BatDauLuc, session.KetThucLuc)

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>

      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Button size="large" type="text" icon={<LeftOutlined />}
          onClick={() => navigate(-1)} />
        <Title level={3} style={{ margin: 0 }}>Buổi học {session.BuoiSo}</Title>

        <UnlockButton
          session={session}
          onSave={handleSaveSession}
          onReload={fetchSession}
        />
      </Row>

      <Form form={form} layout="vertical">

        {/* thông tin chung từ DB và nội dung buổi học */}
        <Card variant='borderless' title='Thông tin buổi học'
          style={{ marginBottom: 24, borderRadius: 8 }}
          styles={{ header: { backgroundColor: '#f0f5ff', color: '#1d39c4' } }}
          extra={
            <Button onClick={() => setOpenDrawer(true)}
              type='link'
            >Xem danh sách</Button>
          }>

          <Descriptions size="small"
            style={{ marginBottom: 24 }}
            styles={{ label: { color: 'black' } }}
            column={{ xs: 1, sm: 2, md: 3 }}>
            <Descriptions.Item label="Lớp">
              <Text><ReadOutlined style={{ color: '' }} /> {session.LopHoc}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Buổi số"><Text>{session.BuoiSo}</Text></Descriptions.Item>
            <Descriptions.Item label="Ngày học">
              <Text><CalendarOutlined style={{ color: '#187cff' }} /> {ngayHoc}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Giáo viên">
              <Text><UserOutlined style={{ color: '#8c8c8c' }} /> {session.GiaoVien}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Phòng">
              <Text>
                <EnvironmentOutlined style={{ color: '#8c8c8c' }} /> {session.PhongHoc ?? '_'}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              <Text><ClockCircleOutlined style={{ color: '#faad14' }} /> {gioHoc}</Text>
            </Descriptions.Item>
          </Descriptions>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item label="Chủ đề buổi học" name="ChuDe"
                rules={[{ required: true, message: 'Vui lòng nhập chủ đề!' }]}>
                <Input placeholder="Ví dụ: Unit 5 - Present Simple" size="large" />
              </Form.Item>
              <Form.Item label="Nội dung chi tiết" name="NoiDungBaiHoc">
                <TextArea rows={4} placeholder="Nội dung chi tiết các phần đã dạy..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Bài tập về nhà " name="BaiTapVeNha">
                <TextArea rows={2} placeholder="Bài tập giao cho học viên..." />
              </Form.Item>
              <Form.Item label="Nhận xét chung về lớp" name="NhanXetChung"
                rules={[{ required: true, message: 'Vui lòng nhập nhận xét!' }]}>
                <TextArea rows={3} placeholder="..." />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* phần upload hình ảnh hoặc video */}
        <Card title="Upload hình ảnh hoặc video"
          variant='borderless' style={{ marginBottom: 24, borderRadius: 8 }}
          styles={{
            header: { backgroundColor: '#f0f5ff', color: '#1d39c4' }
          }}
        >
          <Form.Item name="file" noStyle valuePropName={"fileList"}
            getValueFromEvent={(e) => { // đảm bảo các file là 1 mảng
              if (Array.isArray(e)) return e
              return e?.fileList || []
            }}
          >
            <Dragger multiple fileList={fileList} disabled={isAdmin}
              customRequest={handleUpload} onRemove={handleRemoveFile}
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

        <Card title="Bộ sưu tập"
          styles={{
            header: { backgroundColor: '#f0f5ff', color: '#1d39c4' }
          }}
          variant='borderless' style={{ marginBottom: 24, borderRadius: 8 }}>
          <FileUpload
            getOldFile={handleGetOldFile}
            sessionId={buoiHocId}
            reload={reload}
          />
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
      <NavigateDrawer
        onCancel={() => setOpenDrawer(false)}
        open={openDrawer}
      />
    </div>
  )
}

export default SessionDetail