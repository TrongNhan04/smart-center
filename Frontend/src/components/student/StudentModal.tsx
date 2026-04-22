import { Col, DatePicker, Form, Input, InputNumber, message, Modal, notification, Row, Select } from "antd"
import { useEffect, useState } from "react"
import { mapDataStudent, type StudentDB, type StudentDto } from "./StudentDTO"
import { studentApi } from "../../api/studentApi"
import type { ClassForCmb } from "../class/ClassDTO"
import classApi from "../../api/classApi"
import dayjs from "dayjs"
import { getChangedValue } from "../common/utils"

interface Props {
  open: boolean,
  onSave: (studentId: number) => void,
  onCancel: () => void,
  editing: StudentDB
}

const StudentModal = ({ open, onSave, onCancel, editing }: Props) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<ClassForCmb[]>([])
  const isEdit = editing ? true : false

  const handleError = (error: any) => {
    notification.error({
      title: 'Có lỗi xảy ra',
      description: error.response.data.message,
      showProgress: true,
      pauseOnHover: true
    })
  }

  // useEffect 1: load data cho combobox 
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await classApi.findManyForCmb()
        setClasses(res.data)
      } catch (error: any) {
        handleError(error)
        console.log("Có lỗi xảy ra", error)
      }
    }

    fetchClasses()
  }, [])

  // useEffect 2 lấy dữ liệu cho form
  useEffect(() => {
    if (open) {
      if (editing) {
        const formData = mapDataStudent(editing)
        const payload = {
          ...formData, dob: dayjs(formData.dob)
        }
        form.setFieldsValue(payload)
      }
      else
        form.resetFields()
    }
  }, [open, editing, form])

  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  const classOption = classes.map(item => {
    const timetable = item.LichHoc.map(m => dow[m]).join(',')
    return {
      label: `${item.MaLopHoc} - ${timetable} (${item.GioHoc}) - ${item.TongGhiDanh}/${item.SiSo} HV`,
      value: item.ID
    }
  })

  const handleClassChange = (classId: number) => {
    const lophoc = classes.find(f => f.ID === classId)
    if (lophoc)
      form.setFieldValue('fee', lophoc.HocPhi)
  }

  const handleOK = async () => {
    setLoading(true)
    try { // dữ liệu từ form (tiếng anh)
      const values: StudentDto = await form.validateFields()
      const payload: StudentDto = {
        ...values,
        fee: Number(values.fee)
      }
      await new Promise(resolve => setTimeout(resolve, 1000))

      let res
      if (isEdit) {
        const originData = mapDataStudent(editing)
        const updateData = getChangedValue(originData, payload)
        if (Object.keys(updateData).length === 0) {
          message.info('Không có thông tin nào thay đổi!')
          return
        }
        res = await studentApi.update(editing.ID, updateData)
      }
      else res = await studentApi.create(payload)
      
      message.success(isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công')
      onSave(res.data.ID)
      handleCancel()
    }
    catch (error: any) {
      // bắt lỗi từ backend
      console.log("Có lỗi xảy ra: ", error.response.data.message)

      if (error.response) {
        const serverError = error.response.data
        // nếu là mảng lỗi thì lấy cái đầu tiên
        if (Array.isArray(serverError.message))
          message.error(serverError.message[0])
        else if (typeof serverError.message === 'string')
          handleError(error)
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

  return (
    <Modal
      title={isEdit ? 'Cập nhật học viên' : 'Thêm học viên'}
      open={open}
      onCancel={handleCancel}
      onOk={handleOK}
      width={700}
      okText="Lưu lại"
      cancelText="Hủy bỏ"
      centered // canh giữa màn hình
      maskClosable={false}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        {/* Mã học viên, ngày sinh*/}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item // mã học viên
              label="Mã học viên"
              name="code"
              rules={[{ required: true, message: 'Vui lòng nhập mã học viên!' }]}
            >
              <Input disabled={isEdit}
                placeholder="Vd: HV-101..." />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item // ngày sinh
              label="Ngày sinh"
              name="dob"
              rules={[{ required: true, message: 'Vui lòng chọn ngày sinh!' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
              // placeholder={['Từ ngày', 'Đến ngày']}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Tên học viên - tên phụ huynh */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item // tên học viên
              label="Học viên"
              name="student"
              rules={[{ required: true, message: 'Vui lòng nhập tên học viên!' }]}
            >
              <Input placeholder="Họ và tên học viên..." />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item // tên phụ huynh
              label="Phụ huynh"
              name="parent"
              rules={[{ required: true, message: 'Vui lòng nhập tên phụ huynh!' }]}
            >
              <Input placeholder="Họ và tên phụ huynh..." />
            </Form.Item>
          </Col>
        </Row>

        {/* Email - điện thoại */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item // Email
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Nhập Email!' },
                { type: 'email', message: 'Nhập đúng định dạnh email!' }
              ]}
            >
              <Input disabled={isEdit} type='email' placeholder="Vd: vidu@gmail.com" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item // điện thoại
              label="Số điện thoại"
              name="phone"
              rules={[
                { required: true, message: 'Nhập số điện thoại!' },
                {
                  pattern: /^0\d{9}$/,
                  message: 'Số điện thoại là số có 10 chữ số'
                }
              ]}>

              <Input disabled={isEdit} placeholder='Vd: 0123456789' />
            </Form.Item>
          </Col>
        </Row>

        {/* Lớp học - học phí chỉ hiện khi thêm học viên*/}
        {!isEdit && <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Lớp học"
              name="classId"
              rules={[{ required: true, message: 'Vui lòng chọn lớp học' }]}
            >
              <Select
                placeholder="Chọn lớp học"
                options={classOption}
                showSearch={{
                  filterOption: (input, option) =>
                    (option?.label ?? '').toLowerCase()
                      .includes(input.toLowerCase())
                }}
                onChange={handleClassChange}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Học phí"
              name="fee"
              rules={[{ required: true, message: 'Nhập học phí!' }]}>

              <InputNumber
                style={{ width: '100%' }}
                placeholder="Nhập số tiền..."
                // format phân cách hàng nghìn
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') || ""}
                parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                suffix="VNĐ" // Ký hiệu tiền tệ ở đuôi
                step={1000}
              />
            </Form.Item>
          </Col>
        </Row>}

        {/* Chuyên môn */}
        <Form.Item label="Địa chỉ" name="address">
          <Input.TextArea
            rows={4}
            placeholder="..."
            showCount
            maxLength={100}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default StudentModal