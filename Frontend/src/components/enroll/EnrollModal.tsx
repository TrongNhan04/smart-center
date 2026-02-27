import { Form, Input, InputNumber, message, Modal, notification, Select } from "antd"
import { useEffect, useState } from "react"
import type { ClassForCmb } from "../class/ClassDTO"
import type { StudentForCmb } from "../student/StudentDTO"
import classApi from "../../api/classApi"
import type { EnrollDto } from "./EnrollDTO"
import { enrollApi } from "../../api/enrollApi"
import { studentApi } from "../../api/studentApi"

interface Props {
  open: boolean,
  onCancel: () => void,
  onSave: (enrollId: number) => void
}

const EnrollModal = ({ open, onCancel, onSave }: Props) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<ClassForCmb[]>([])
  const [students, setStudents] = useState<StudentForCmb[]>([])

  const handleError = (error: any) => {
    notification.error({
      title: 'Có lỗi xảy ra',
      description: error.response.data.message,
      showProgress: true,
      pauseOnHover: true
    })
    console.log("Có lỗi xảy ra", error)
  }
  const fetchClasses_Students = async () => {
    try {
      const [classRes, studentRes] = await Promise.all([
        classApi.findManyForCmb(),
        studentApi.findManyForCmb()
      ])
      setClasses(classRes.data)
      setStudents(studentRes.data)
    } catch (error) {
      handleError(error)
    }
  }
  useEffect(() => {
    if(open)
      fetchClasses_Students()
  }, [open])
  //JPN-N3-01 - Thứ 3,5,7 (19:00-21:00) - 12/15 HV
  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  const classOption = classes.map(item => {
    const timetable = item.LichHoc.map(m => dow[m]).join(',')
    return {
      label: `${item.MaLopHoc} - ${timetable} (${item.GioHoc}) - ${item.TongGhiDanh}/${item.SiSo} HV`,
      value: item.ID
    }
  })

  const studentOption = students.map(item => ({
    label: item.MaHocVien + ' - ' + item.TenHocVien,
    value: item.ID
  }))

  const handleClassChange = (classId: number) => {
    const lophoc = classes.find(f => f.ID === classId)
    if (lophoc)
      form.setFieldValue('fee', lophoc.HocPhi)
  }

  const handleOK = async () => {
    setLoading(true)
    try { // dữ liệu từ form (tiếng anh)
      const values: EnrollDto = await form.validateFields()

      const payload: EnrollDto = {
        ...values,
        fee: Number(values.fee)
      }
      await new Promise(resolve => setTimeout(resolve, 1000))

      const res = await enrollApi.create(payload)
      message.success('Thêm mới thành công')
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
      title="Ghi danh mới"
      open={open}
      onCancel={handleCancel}
      onOk={handleOK}
      width={400}
      okText="Lưu lại"
      cancelText="Hủy bỏ"
      centered // canh giữa màn hình
      maskClosable={false}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" size="middle">
        {/* Mã học viên, ngày sinh*/}
        {/* <Row gutter={16}> */}
        {/* <Col span={14}> */}
        <Form.Item // chọn lớp học
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
        {/* </Col> */}

        {/* <Col span={12}> */}
        <Form.Item // chọn học viên
          label="Học viên"
          name="studentId"
          rules={[{ required: true, message: 'Vui lòng chọn học viên' }]}
        >
          <Select
            placeholder="Chọn học viên"
            options={studentOption}
            showSearch={{
              filterOption: (input, option) =>
                (option?.label ?? '').toLowerCase()
                  .includes(input.toLowerCase())
            }}
            onChange={handleClassChange}
          />
        </Form.Item>
        {/* </Col> */}

        {/* <Col span={12}> */}
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
        {/* </Col> */}
        {/* </Row> */}

        {/* Lớp học - học phí chỉ hiện khi thêm học viên*/}

        {/* Ghi chú */}
        <Form.Item label="Ghi chú" name="address">
          <Input.TextArea
            rows={4}
            placeholder="Ghi chú (nếu có)..."
            showCount
            maxLength={100}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default EnrollModal