import { Modal, Form, Input, InputNumber, Select, Row, Col, message, Alert } from 'antd';
import { useEffect, useState } from 'react';
import courseApi, { } from '../../api/courseApi';
import { mapDataCourse, type CourseDB } from './CourseDTO';
import { getChangedValue } from '../common/utils';
import { CatchError } from '../common/catch.error';

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
      const values = await form.validateFields()
      await new Promise(resolve => setTimeout(resolve, 1000))
      // xóa số 
      const formatedSyllabus = () => values.syllabus
        .split('\n') // cắt mỗi ông theo dòng
        .filter((line: string) => line.trim() !== '') // ông nào rỗng thì bỏ
        .map((line: string, index: number) => ({
          ThuTu: index + 1,
          // xóa số đầu chuỗi và space
          ChuDe: line.replace(/^\d+/, '').trim()
        }))
      const newValues = { ...values, syllabus: formatedSyllabus() }

      let payload
      if (isEdit) {
        const originData = mapDataCourse(editingCourse)
        const updateData = getChangedValue(originData, values)
        if (Object.keys(updateData).length === 0) {
          message.info('Không có thông tin nào thay đổi!')
          return
        }
        payload = await courseApi.update
          (editingCourse.ID, { ...updateData, syllabus: formatedSyllabus() })
      }
      else payload = await courseApi.create(newValues)

      message.success(isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công')
      onSave(payload.data.ID)
      handleCancel()

    }
    catch (error: any) {
      CatchError.HandleError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  useEffect(() => {
    if (!open) return
    // console.log()
    if (editingCourse) {
      const formData = mapDataCourse(editingCourse)
      form.setFieldsValue(formData)
    }
    else
      form.resetFields()
  }, [open, form, editingCourse])

  return (
    <Modal
      title={isEdit ? 'Cập nhật khóa học' : 'Thêm khóa học'}
      open={open}
      onCancel={handleCancel}
      onOk={handleOK}
      width={900}
      okText="Lưu lại"
      cancelText="Hủy bỏ"
      centered // canh giữa màn hình
      maskClosable={false}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        {/* Mã khóa học (trái) - Tên khóa học (phải) */}
        <Row gutter={16}>
          {/* cột 1 14 */}
          <Col span={14}>

            {/* chia cột nữa thì cần row, lúc này row span 24 */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item // mã khóa học
                  label="Mã khóa học"
                  name="code"
                  rules={[{ required: true, message: 'Vui lòng nhập mã khóa học!' }]}
                >
                  <Input disabled={isEdit} placeholder="Vd: ENG-101..." />
                </Form.Item>

                <Form.Item // trình độ
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

                <Form.Item // thời gian
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
                <Form.Item // tên khóa học
                  label="Tên khóa học"
                  name="name"
                  rules={[{ required: true, message: 'Vui lòng nhập tên khóa học!' }]}
                >
                  <Input placeholder="Vd: tiếng Anh giao tiếp..." />
                </Form.Item>

                <Form.Item // học phí
                  label="Học phí"
                  name="courseFee"
                  rules={[
                    { required: true, message: 'Nhập học phí!' },
                    { type: 'number', min: 0, message: 'Học phí không thể thấp hơn 0' }
                  ]}>

                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Nhập số tiền..."
                    //format phân cách hàng nghìn
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
                    suffix="VNĐ" // Ký hiệu tiền tệ ở đuôi
                  />
                </Form.Item>

                <Form.Item // tổng số buổi
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
            <Form.Item // mô tả
              label="Mô tả chi tiết" name="description">
              <Input.TextArea
                rows={6}
                placeholder="Chi tiết khóa học, yêu cầu đầu vào..."
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Col>

          <Col span={10}>
            <Alert
              title="Vui lòng liệt kê các chủ đề theo thứ tự từ 
trên xuống dưới, mỗi chủ đề một dòng."
              type="warning"
              showIcon
              style={{ marginBottom: 10 }}
            />
            <Form.Item // đề cương
              name="syllabus"
              rules={[{ required: true, message: 'Vui lòng nhập đề cương' }]}>
              <Input.TextArea
                rows={16}
                placeholder='Simple Present...'
                showCount
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default CourseModal


// Chào hỏi và giới thiệu bản thân
// Bảng chữ cái và phát âm cơ bản
// Số đếm và ngày tháng
// Đại từ nhân xưng và động từ “to be”
// Gia đình và bạn bè
// Nghề nghiệp và nơi làm việc
// Thì hiện tại đơn (Present Simple)
// Thói quen hằng ngày
// Sở thích và giải trí
// Mô tả người và ngoại hình
// Địa điểm trong thành phố
// Chỉ đường và hỏi đường
// Thì hiện tại tiếp diễn (Present Continuous)
// Hoạt động đang diễn ra
// Thức ăn và đồ uống
// Gọi món và giao tiếp nhà hàng
// Thì quá khứ đơn (Past Simple)
// Kể về trải nghiệm trong quá khứ
// Du lịch và kỳ nghỉ
// Đặt phòng khách sạn và vé máy bay
// So sánh hơn và so sánh nhất
// Mua sắm và giá cả
// Sức khỏe và cơ thể
// Đi khám bệnh và mô tả triệu chứng
// Thì tương lai (will / going to)
// Kế hoạch và dự định
// Thời tiết và môi trường
// Công nghệ và mạng xã hội
// Giao tiếp qua điện thoại
// Viết email cơ bản
// Câu điều kiện loại 1
// Giải quyết vấn đề và đưa ra lời khuyên
// Câu bị động (Passive Voice)
// Tin tức và truyền thông
// Phỏng vấn xin việc
// Kỹ năng thuyết trình cơ bản
// Thành ngữ và cụm động từ (Phrasal verbs)
// Ôn tập ngữ pháp tổng hợp
// Luyện nghe và phản xạ giao tiếp
// Kiểm tra và tổng kết khóa học