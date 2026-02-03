import { Modal, Form, Input, InputNumber, Select, Row, Col, message } from 'antd';
import { useState } from 'react';

// Định nghĩa Props chỉ để nhận lệnh Đóng/Mở từ cha
interface AddCourseModalProps {
  open: boolean;
  onCancel: () => void;
}

interface Course {
  code: string,
  name: string,
  level: string,
  duration: number,
  courseFee: number,
  description: string
}

const AddCourseModal = ({ open, onCancel }: AddCourseModalProps) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleOK = async () => {
    try {
      const values: Course = await form.validateFields()

      const payload = { ...values, description: values.description || null }
      setLoading(true)
      // call api thật thì bỏ dòng này
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log("Values: ", payload)

      message.success('Thêm khóa học thành công!')
      form.resetFields()
      onCancel()
    } catch (error) {
      console.log("error: ", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title="Thêm khóa học mới"
      open={open}
      onCancel={handleCancel}
      onOk={handleOK}
      width={600}
      okText="Lưu lại"
      cancelText="Hủy bỏ"
      centered // canh giữa màn hình
      maskClosable={false}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        {/* Mã khóa học (trái) - Tên khóa học (phải) */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Mã khóa học"
              name="code"
              rules={[{ required: true, message: 'Vui lòng nhập mã khóa học!' }]}
            >
              <Input placeholder="Vd: ENG-101..." />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Tên khóa học"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên khóa học!' }]}
            >
              <Input placeholder="Vd: tiếng Anh giao tiếp..." />
            </Form.Item>
          </Col>
        </Row>

        {/* Trình độ (trái) - Học phí (phải) */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Trình độ"
              name="level"
              rules={[{ required: true, message: 'Chọn trình độ!' }]}
            >
              <Select
                placeholder="Chọn trình độ"
                options={[
                  { label: 'Sơ Cấp (Beginer)', value: 'BEGINER' },
                  { label: 'Trung cấp (Intermediate)', value: 'INTERMEDIATE' },
                  { label: 'Nâng cao (Advanced)', value: 'ADVANCED' }
                ]} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Học phí (VNĐ)"
              name="courseFee"
              rules={[{ required: true, message: 'Nhập học phí!' }]}>

              <InputNumber
                style={{ width: '100%' }}
                placeholder="Nhập số tiền..."
                // format phân các hàng nghìn
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
                suffix="VNĐ" // Ký hiệu tiền tệ ở đuôi
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Thời gian (trái) - Tổng số buổi (phải) */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Thời gian đào tạo"
              name="duration"
              rules={[{ required: true, message: 'Nhập thời gian đào tạo!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                max={12}
                suffix="Tháng"
                placeholder="VD: 3"
              />

            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Tổng số buổi học"
              name="totalSession"
              rules={[{ required: true, message: 'Nhập tổng số buổi!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                max={150}
                suffix="Buổi"
                placeholder="VD: 3"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Mô tả */}
        <Form.Item label="Mô tả chi tiết" name="">
          <Input.TextArea
            rows={4}
            placeholder="Chi tiết khóa học, lộ trình, yêu cầu đầu vào..."
            showCount
            maxLength={500}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddCourseModal;