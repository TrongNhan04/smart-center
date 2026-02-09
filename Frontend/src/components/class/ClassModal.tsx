import {
  Modal, Form, Input, Select, DatePicker, TimePicker,
  InputNumber, Row, Col,
} from 'antd';

const { RangePicker } = DatePicker

// Fake data
const fakeCourses = [
  { id: 1, name: 'Tiếng Anh Giao Tiếp Cơ Bản', code: 'ENG-001' },
  { id: 2, name: 'Tiếng Anh Thương Mại', code: 'ENG-002' },
  { id: 3, name: 'IELTS Foundation', code: 'IELTS-001' },
]

const courseOption = fakeCourses.map(item => ({
  label: item.name,
  value: item.id
}))

const fakeTeachers = [
  { id: 1, name: 'Nguyễn Văn A', code: 'GV001' },
  { id: 2, name: 'Trần Thị B', code: 'GV002' },
  { id: 3, name: 'Lê Văn C', code: 'GV003' },
  { id: 4, name: 'Phạm Thị D', code: 'GV004' },
]

const teacherOption = fakeTeachers.map(item => ({
  label: item.name,
  value: item.id
}))

type Props = {
  open: boolean, onClose: () => void
}

const ClassModal = ({ open, onClose }: Props) => {
  const [form] = Form.useForm()

  const daysOfWeek = [
    { label: 'Chủ nhật', value: 0 },
    { label: 'Thứ 2', value: 1 },
    { label: 'Thứ 3', value: 2 },
    { label: 'Thứ 4', value: 3 },
    { label: 'Thứ 5', value: 4 },
    { label: 'Thứ 6', value: 5 },
    { label: 'Thứ 7', value: 6 },
  ]

  const handleSubmit = () => {
    form.validateFields().then(values => {
      // Xử lý dữ liệu
      // const formData = {
      //   ...values,
      //   // TuNgay: values.NgayHoc?.[0]?.format('YYYY-MM-DD'),
      //   // DenNgay: values.NgayHoc?.[1]?.format('YYYY-MM-DD'),
      //   // GioBatDau: values.GioBatDau?.format('HH:mm'),
      //   // GioKetThuc: values.GioKetThuc?.format('HH:mm'),
      //   // LichHoc: selectedDays.join(','),
      // }

      console.log('Form data:', values)

      // Hiển thị thông báo thành công (fake)
      Modal.success({
        title: 'Thêm lớp học thành công!',
        content: `Đã tạo lớp ${values.TenLop}`,
      })
      form.resetFields()
      onClose()
    })

  }

  return (
    <>
      {/* Modal */}
      <Modal
        title="Thêm lớp học mới"
        open={open}
        onCancel={() => { onClose(); form.resetFields() }}
        width={800}
        okText="Lưu lại"
        cancelText="Hủy bỏ"
        onOk={handleSubmit}
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete='true'
        >
          <Row gutter={16}>
            {/* Cột trái */}
            <Col span={12}>
              <Form.Item
                label="Mã lớp học"
                name="MaLopHoc"
                rules={[{ required: true, message: 'Vui lòng nhập mã lớp!' }]}
              >
                <Input placeholder="VD: ENG001-01" />
              </Form.Item>

              <Form.Item
                label="Khóa học"
                name="KhoaHocID"
                rules={[{ required: true, message: 'Vui lòng chọn khóa học!' }]}
              >
                <Select
                  placeholder="Chọn khóa học"
                  showSearch
                  options={courseOption}
                >

                </Select>
              </Form.Item>

              <Form.Item
                label="Tên lớp"
                name="TenLop"
                rules={[{ required: true, message: 'Vui lòng nhập tên lớp!' }]}
              >
                <Input placeholder="VD: Lớp Sáng T2-T4-T6" />
              </Form.Item>

              <Form.Item
                label="Giáo viên"
                name="GiaoVienID"
                rules={[{ required: true, message: 'Vui lòng chọn giáo viên!' }]}
              >
                <Select
                  placeholder="Chọn giáo viên"
                  showSearch
                  options={teacherOption}
                >
                </Select>
              </Form.Item>

              <Form.Item
                label="Phòng học"
                name="PhongHoc"
              >
                <Select
                  placeholder="Chọn phòng học (tùy chọn)"
                  allowClear
                >
                </Select>
              </Form.Item>
            </Col>

            {/* Cột phải */}
            <Col span={12}>
              <Form.Item
                label="Thời gian học"
                name="NgayHoc"
                rules={[{ required: true, message: 'Vui lòng chọn thời gian!' }]}
              >
                <RangePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder={['Từ ngày', 'Đến ngày']}
                />
              </Form.Item>

              <Form.Item
                name="LichHoc"
                label="Lịch học trong tuần"
                rules={[{ required: true, message: 'Chọn lịch học' }]}
              >
                <Select placeholder="Chọn lịch học" mode="multiple"
                  options={daysOfWeek}
                >
                </Select>
              </Form.Item>

              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item
                    label="Giờ bắt đầu"
                    name="GioBatDau"
                    rules={[{ required: true, message: 'Chọn giờ!' }]}
                  >
                    <TimePicker
                      style={{ width: '100%' }}
                      format="HH:mm"
                      placeholder="VD: 18:00"
                      minuteStep={15}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Giờ kết thúc"
                    name="GioKetThuc"
                    rules={[{ required: true, message: 'Chọn giờ!' }]}
                  >
                    <TimePicker
                      style={{ width: '100%' }}
                      format="HH:mm"
                      placeholder="VD: 20:00"
                      minuteStep={15}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Sĩ số"
                name="SiSo"
                rules={[
                  { required: true, message: 'Vui lòng nhập sĩ số!' },
                  { type: 'number', min: 1, max: 50, message: 'Sĩ số từ 1-50' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={50}
                  placeholder="VD: 20"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  )
}

export default ClassModal