import {
  Modal, Form, Input, Select, DatePicker, TimePicker,
  InputNumber, Row, Col, message, Space,
} from 'antd';
import { useEffect, useState } from 'react';
import courseApi from '../../api/courseApi';
import teacherApi from '../../api/teacherApi';
import type { CourseDB } from '../course/CourseInterface';
import type { TeacherDB } from '../teacher/TeacherInterface';
import dayjs from 'dayjs';
import classApi from '../../api/classApi';
import { mapRecordToFormClass, type ClassDB, type ClassDto } from './ClassInterface';

const { RangePicker } = DatePicker

type Props = {
  open: boolean,
  onClose: () => void
  khoahocId: number | null
  onSave: (id: number) => void
  editingClass: ClassDB
}

const ClassModal = ({
  open, onClose, khoahocId, onSave, editingClass }: Props) => {
  const isEdit = editingClass ? true : false
  const [form] = Form.useForm()
  const [courses, setCourses] = useState<CourseDB[]>([])
  const [teachers, setTeachers] = useState<TeacherDB[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchCourse_Teacher = async () => {
      setLoading(true)
      try {
        const [courseRes, teacherRes] = await Promise.all([
          courseApi.findMany(),
          teacherApi.findMany()
        ])
        setCourses(courseRes.data)
        setTeachers(teacherRes.data)
      }
      catch (error: any) {
        message.error("Có lỗi xuất hiện")
        console.log("Lỗi: ", error.response.data.message)
      }
      finally {
        setLoading(false)
      }
    }
    fetchCourse_Teacher()

    if (open) {
      if (editingClass) {
        const formData = mapRecordToFormClass(editingClass)
        console.log("data của table truyền cho form: ", formData)
        form.setFieldsValue(formData)
      }
      else
        form.resetFields()
    }
  }, [open, form, editingClass])

  const daysOfWeek = [
    { label: 'Chủ nhật', value: 0 },
    { label: 'Thứ 2', value: 1 },
    { label: 'Thứ 3', value: 2 },
    { label: 'Thứ 4', value: 3 },
    { label: 'Thứ 5', value: 4 },
    { label: 'Thứ 6', value: 5 },
    { label: 'Thứ 7', value: 6 },
  ]

  const courseOption = []
  for (var item of courses) {
    if (item.TrangThai !== 'INACTIVE')
      courseOption.push({
        label: item.TenKhoaHoc,
        value: item.ID
      })
  }

  const teacherOption = []
  for (var i of teachers) {
    if (i.TrangThai !== 'INACTIVE')
      teacherOption.push({
        label: i.HoTen,
        value: i.ID,
        desc: i.MaGiaoVien
      })
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const values = await form.validateFields()
      // tách riêng fromToDate => rest là phần còn lại
      const { fromToDate, ...rest } = values

      await new Promise(resolve => { setTimeout(resolve, 1000) })
      // endTime, fromToDate, startTime
      const payload: ClassDto = {
        ...rest, // phần còn lại
        fromDate: dayjs(values.fromToDate[0]).toISOString(),
        toDate: dayjs(values.fromToDate[1]).toISOString(),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
      }
      console.log("value của payload trước khi call api: ", payload)

      const res = await classApi.create(payload)
      message.success(`Tạo lớp ${payload.name} thành công`)

      onSave(res.data.ID)
      form.resetFields()
      onClose()
    }
    catch (error: any) {
      console.log("Có lỗi xảy ra: ", error.response.data.message)

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
    }
    finally {
      setLoading(false)
    }
  }

  const handleCancel = () => { onClose(); form.resetFields() }
  const { value: initCourseId } = courseOption.find(
    f => f.value === khoahocId) || {}

  return (
    <>
      {/* Modal */}
      <Modal
        title={isEdit ? 'Cập nhật lớp học' : 'Thêm lớp học'}
        open={open}
        onCancel={handleCancel}
        width={800}
        okText="Lưu lại"
        cancelText="Hủy bỏ"
        onOk={handleSubmit}
        maskClosable={false}
        confirmLoading={loading}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete='true'
          initialValues={{ courseId: initCourseId }}
        >
          <Row gutter={16}>
            {/* Cột trái */}
            <Col span={12}>
              <Form.Item
                label="Mã lớp học"
                name="code"
                rules={[{ required: true, message: 'Vui lòng nhập mã lớp!' }]}
              >
                <Input placeholder="VD: ENG001-01" />
              </Form.Item>

              <Form.Item
                label="Khóa học"
                name="courseId"
                rules={[{ required: true, message: 'Vui lòng chọn khóa học!' }]}
              >
                <Select
                  placeholder="Chọn khóa học"
                  // showSearch
                  //maxCount={3}
                  options={courseOption}
                />
              </Form.Item>

              <Form.Item
                label="Tên lớp"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên lớp!' }]}
              >
                <Input placeholder="VD: Lớp Sáng T2-T4-T6" />
              </Form.Item>

              <Form.Item
                label="Giáo viên"
                name="teacherId"
                rules={[{ required: true, message: 'Vui lòng chọn giáo viên!' }]}
              >
                <Select
                  placeholder="Chọn giáo viên"
                  // showSearch
                  options={teacherOption}
                  optionRender={(teacherOption) => (
                    <Space>
                      {`${teacherOption.data.label} (${teacherOption.data.desc})`}
                    </Space>
                  )}
                />
              </Form.Item>
            </Col>

            {/* Cột phải */}
            <Col span={12}>
              <Form.Item
                label="Thời gian học"
                name="fromToDate"
                rules={[{ required: true, message: 'Vui lòng chọn thời gian!' }]}
              >
                <RangePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder={['Từ ngày', 'Đến ngày']}
                />
              </Form.Item>

              <Form.Item
                label="Lịch học trong tuần"
                name="timeTable"
                rules={[{ required: true, message: 'Chọn lịch học' }]}
              >
                <Select placeholder="Chọn lịch học" mode="multiple"
                  options={daysOfWeek}
                />
              </Form.Item>

              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item
                    label="Giờ bắt đầu"
                    name="startTime"
                    rules={[{ required: true, message: 'Chọn giờ!' }]}
                  >
                    <TimePicker
                      style={{ width: '100%' }}
                      format="HH:mm"
                      placeholder="VD: 18:00"
                      minuteStep={15}
                      disabledTime={() => ({
                        disabledHours: () => [0, 1, 2, 3, 4, 5, 6, 22, 23]
                      })}
                      hideDisabledOptions={true}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Giờ kết thúc"
                    name="endTime"
                    rules={[{ required: true, message: 'Chọn giờ!' }]}
                  >
                    <TimePicker
                      style={{ width: '100%' }}
                      format="HH:mm"
                      placeholder="VD: 20:00"
                      minuteStep={15}
                      disabledTime={() => ({
                        disabledHours: () => [0, 1, 2, 3, 4, 5, 6, 22, 23]
                      })}
                      hideDisabledOptions={true}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Sĩ số"
                name="classSize"
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