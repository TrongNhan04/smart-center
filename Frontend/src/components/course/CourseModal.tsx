import { Modal, Form, Input, InputNumber, Select, Row, Col, message } from 'antd';
import { useEffect, useState } from 'react';
import courseApi, { } from '../../api/courseApi';
import {mapDataCourse, type CourseDB, type CourseDto } from './CourseDTO';
import { getChangedValue } from '../common/utils';

interface Props {
  open: boolean,
  onCancel: () => void,
  onSave: (id: number) => void,
  editingCourse: CourseDB
}

const CourseModal = ({ open, onCancel, onSave, editingCourse }: Props) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const isEdit = editingCourse ? true : false
  const handleOK = async () => {
    setLoading(true)
    try {
      // dữ liệu từ form (tiếng anh)
      const values: CourseDto = await form.validateFields()

      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const originData = mapDataCourse(editingCourse)
      const updateData = getChangedValue(originData, values)
      // console.log('updateData: ', updateData)
      const payload = isEdit ? await courseApi.update(editingCourse.ID, updateData) :
        await courseApi.create(values)

      message.success(isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công')
      onSave(payload.data.ID)
      handleCancel()
    }
    catch (error: any) {
      // bắt lỗi từ backend
      console.log("Có lỗi xảy ra: ", error)

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
    if (open) {
      if (editingCourse) {
        const formData = mapDataCourse(editingCourse)
        form.setFieldsValue(formData)
      }
      else
        form.resetFields()
    }
  }, [open, form, editingCourse])

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
                // format phân cách hàng nghìn
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
        <Form.Item label="Mô tả chi tiết" name="description">
          <Input.TextArea
            rows={4}
            placeholder="Chi tiết khóa học, lộ trình, yêu cầu đầu vào..."
            showCount
            maxLength={500}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CourseModal