import {
  Modal, Form, Input, Select, DatePicker, TimePicker,
  InputNumber, Row, Col, message, Space,
} from 'antd';
import { useEffect, useState } from 'react';
import courseApi from '../../api/courseApi';
import teacherApi from '../../api/teacherApi';
import type { CourseDB } from '../course/CourseDTO';
import type { TeacherDB } from '../teacher/TeacherInterface';
import dayjs from 'dayjs';
import classApi from '../../api/classApi';
import { mapRecordToFormClass, type ClassDB, type ClassDto } from './ClassDTO';
import { DateHelper } from './date.helper';

const { RangePicker } = DatePicker

type Props = {
  open: boolean,
  onCancel: () => void
  khoahocId: number | null
  onSave: (id: number) => void
  editingClass: ClassDB
}

const ClassModal = ({
  open, onCancel, khoahocId, onSave, editingClass }: Props) => {
  const isEdit = editingClass ? true : false
  const [form] = Form.useForm()
  const [courses, setCourses] = useState<CourseDB[]>([])
  const [teachers, setTeachers] = useState<TeacherDB[]>([])
  const [loading, setLoading] = useState(false)

  // useEffect 1 chỉ tải data cho combobox
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
        // message.error("Có lỗi xuất hiện")
        // console.log("Lỗi: ", error.response.data.message)
      }
      finally {
        setLoading(false)
      }
    }
    fetchCourse_Teacher()
  }, [])

  // useEffect 2 load dữ liệu khi mở form
  useEffect(() => {
    if (open) {
      if (editingClass) {
        // từ tiếng việt thành tiếng anh
        const record = mapRecordToFormClass(editingClass)
        // tách fromDate, toDate, startTime, endTime ra riêng 
        const { fromDate, toDate, startTime, endTime, ...rest } = record
        const formData = {
          ...rest,
          // gộp thành fromToDate
          fromToDate: [dayjs(fromDate), dayjs(toDate)],
          // format từ string sthành dayjs để hiện lên form
          startTime: DateHelper.ConvertHourStrToDayJS(startTime),
          endTime: DateHelper.ConvertHourStrToDayJS(endTime),
        }
        // console.log("data của table truyền cho form: ", formData)
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
      // console.log("values từ form: ", values)

      await new Promise(resolve => { setTimeout(resolve, 1000) })

      // tách riêng fromToDate => rest là phần còn lại
      const { fromToDate, ...rest } = values
      // endTime, fromToDate, startTime
      const payload: ClassDto = {
        ...rest, // phần còn lại
        fromDate: dayjs(values.fromToDate[0]).toISOString(),
        toDate: dayjs(values.fromToDate[1]).toISOString(),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
        room: values.room || null,
      }
      let res = null
      if (isEdit && editingClass.TrangThai === 'OPEN')
        res = await classApi.updateOpen(editingClass.ID, payload)
      else if (isEdit && editingClass.TrangThai === 'RUNNING')
        res = await classApi.updateRunning(editingClass.ID, payload)
      else
        res = await classApi.create(payload)

      message.success(`Thao tác thành công`)
      onSave(res.data.ID)
      handleCancel()
    }
    catch (error: any) {
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
    }
    finally {
      setLoading(false)
    }
  }

  const handleCancel = () => { form.resetFields(); onCancel() }
  const { value: initCourseId } = courseOption.find(
    f => f.value === khoahocId) || {}

  return (
    <>
      {/* Modal */}
      <Modal
        title={isEdit ? 'Cập nhật lớp học' : 'Thêm lớp học'}
        open={open}
        onCancel={handleCancel}
        width={700}
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
              <Form.Item // tên khóa học
                label="Khóa học"
                name="courseId"
                rules={[{ required: true, message: 'Vui lòng chọn khóa học!' }]}
              >
                {isEdit ?
                  <div style={{ padding: '4px 11px', color: '#000' }}>
                    - {editingClass.KhoaHoc.TenKhoaHoc}
                  </div>
                  : <Select
                    placeholder="Chọn khóa học"
                    options={courseOption}
                    disabled={isEdit}
                  />}
              </Form.Item>
              
              <Form.Item // mã lớp học
                label="Mã lớp học"
                name="code"
                rules={[{ required: true, message: 'Vui lòng nhập mã lớp!' }]}
              >
                {isEdit ?
                  <div style={{ padding: '4px 11px', color: '#000' }}>
                    - {editingClass.MaLopHoc}
                  </div>
                  : (<Input readOnly={isEdit} placeholder="VD: ENG001-01" />)
                }
              </Form.Item>

              <Form.Item // tên lớp
                label="Tên lớp"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên lớp!' }]}
              >
                <Input placeholder="VD: Lớp Sáng T2-T4-T6" />
              </Form.Item>

              <Form.Item // giáo viên
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
              <Form.Item // thời gian học
                label="Thời gian học"
                name="fromToDate"
                rules={[{ required: true, message: 'Vui lòng chọn thời gian!' }]}
              >
                {isEdit && editingClass.TrangThai === 'RUNNING' ?
                  <div style={{ padding: '4px 11px', color: '#000' }}>
                    {/* {`- Từ ngày: ${editingClass.TuNgay.slice(0, 10)} đến ngày: ${editingClass.DenNgay.slice(0, 10)}`} */}
                    - Từ ngày: {new Date(editingClass.TuNgay).toLocaleDateString()}
                    &nbsp; đến ngày: {new Date(editingClass.DenNgay).toLocaleDateString()}
                  </div>
                  : <RangePicker
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                    placeholder={['Từ ngày', 'Đến ngày']}
                    disabled={isEdit && editingClass.TrangThai === 'RUNNING'}
                  />
                }
              </Form.Item>

              <Form.Item // lịch học
                label="Lịch học trong tuần"
                name="timeTable"
                rules={[{ required: true, message: 'Chọn lịch học' }]}
              >
                {isEdit && editingClass.TrangThai === 'RUNNING' ?
                  <div style={{ padding: '4px 11px', color: '#000' }}>
                    - {editingClass.LichHoc.map(
                      // lấy thứ từ dow rồi ghép lại 
                      item => daysOfWeek[item].label).join(', ')}
                  </div>
                  : <Select placeholder="Chọn lịch học" mode="multiple"
                    options={daysOfWeek}
                    maxCount={7}
                    disabled={isEdit && editingClass.TrangThai === 'RUNNING'}
                  />
                }
              </Form.Item>

              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item // giờ bắt đầu
                    label="Giờ bắt đầu"
                    name="startTime"
                    rules={[{ required: true, message: 'Chọn giờ!' }]}
                  >
                    {isEdit && editingClass.TrangThai === 'RUNNING' ?
                      <div style={{ padding: '4px 11px', color: '#000' }}>
                        - {editingClass.GioHoc.slice(0, 5)}
                      </div>
                      : <TimePicker
                        style={{ width: '100%' }}
                        format="HH:mm"
                        placeholder="VD: 18:00"
                        minuteStep={15}
                        disabledTime={() => ({
                          disabledHours: () => [0, 1, 2, 3, 4, 5, 6, 22, 23]
                        })}
                        hideDisabledOptions={true}
                        disabled={isEdit && editingClass.TrangThai === 'RUNNING'}
                      />
                    }
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item // giờ kết thúc
                    label="Giờ kết thúc"
                    name="endTime"
                    rules={[{ required: true, message: 'Chọn giờ!' }]}
                  >
                    {isEdit && editingClass.TrangThai === 'RUNNING' ?
                      <div style={{ padding: '4px 11px', color: '#000' }}>
                        - {editingClass.GioHoc.slice(8, 13)}
                      </div>
                      : <TimePicker
                        style={{ width: '100%' }}
                        format="HH:mm"
                        placeholder="VD: 20:00"
                        minuteStep={15}
                        disabledTime={() => ({
                          disabledHours: () => [0, 1, 2, 3, 4, 5, 6, 22, 23]
                        })}
                        hideDisabledOptions={true}
                        disabled={isEdit && editingClass.TrangThai === 'RUNNING'}
                      />
                    }
                  </Form.Item>
                </Col>
              </Row>

              {isEdit ?
                <Row gutter={8}>
                  <Col span={12}>
                    <Form.Item // sĩ số
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
                  <Col span={12}>
                    <Form.Item // phòng học
                      label="Phòng học"
                      name="room"
                    >
                      <Input placeholder="VD: phòng A101" />
                    </Form.Item>
                  </Col>
                </Row> : // không edit thì hiện mỗi ô sĩ số
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
              }
            </Col>
          </Row>
          <Form.Item label="Mô tả chi tiết" name="description">
            <Input.TextArea
              rows={4}
              placeholder="Chi tiết lớp, lộ trình, yêu cầu đầu vào..."
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default ClassModal