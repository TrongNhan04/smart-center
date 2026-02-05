import { Modal, Form, Input, InputNumber, Select, Row, Col, message } from 'antd';
import { useEffect, useState } from 'react';
import { createCourseApi, updateCourseApi } from '../../api/courseApi';
import type { CourseType, CreateCourse } from './CourseInterface';

// Định nghĩa Props chỉ để nhận lệnh Đóng/Mở từ cha
interface AddCourseModalProps {
  open: boolean,
  onCancel: () => void,
  onSave: (id: number) => void,
  editCourse: CourseType
}

const AddCourseModal = ({ open, onCancel, onSave, editCourse }: AddCourseModalProps) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const isEdit = editCourse ? true : false
  const handleOK = async () => {
    try {
      // dữ liệu từ form
      const values: CreateCourse = await form.validateFields()
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      let courseDB
      let payload
      if (editCourse.ID) {
        payload = {
          ID: editCourse.ID,
          MaKhoaHoc: values.code,
          TenKhoaHoc: values.name,
          TrinhDo: values.level,
          HocPhi: values.courseFee,
          ThoiGian: values.duration,
          TongSoBuoi: values.totalSession,
          TrangThai: editCourse.TrangThai,
          MoTa: values.description,
        }
        const res = await updateCourseApi(payload)
        message.success('Cập nhật khóa học thành công!')
        courseDB = res
      }
      else {
        payload = { ...values, description: values.description || "" }

        console.log("Payload: ", payload)
        const res = await createCourseApi(payload)
        message.success('Thêm khóa học thành công!')
        courseDB = res
      }
      onSave(courseDB.data.ID)
      console.log(courseDB.data)
      form.resetFields()
      onCancel()

    } catch (error: any) {
      // bắt lỗi từ backend
      console.log("error: ", error.response.data.message)

      if (error.response) {
        const serverError = error.response.data
        // nếu là mảng lỗi thì lấy cái đầu tiên
        if (Array.isArray(serverError.message))
          message.error(serverError.message[0])
        else if (typeof serverError.message === 'string')
          message.error(serverError.message)
        else
          message.error("Có lỗi xảy ra")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  useEffect(() => {
    if (open)
      if (editCourse) {
        const payload: CreateCourse = {
          code: editCourse.MaKhoaHoc,
          name: editCourse.TenKhoaHoc,
          level: editCourse.TrinhDo,
          courseFee: editCourse.HocPhi,
          duration: editCourse.ThoiGian,
          totalSession: editCourse.TongSoBuoi,
          description: editCourse.MoTa || ""
        }
        form.setFieldsValue(payload)
      }
      else
        form.resetFields()
  }, [editCourse, open, form])

  return (
    <Modal
      title={isEdit ? 'Cập nhật khóa học' : 'Thêm khóa học'}
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
              <Input disabled={isEdit} placeholder="Vd: ENG-101..." />
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
              label="Học phí"
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