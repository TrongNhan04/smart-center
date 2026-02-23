import { Col, Form, Input, message, Modal, Row } from 'antd'
import { useEffect, useState } from 'react'
import { mapDataTeacher, type TeacherDB, type TeacherDto } from './TeacherDTO'
import teacherApi from '../../api/teacherApi'

interface Props {
  open: boolean
  onCancel: () => void
  onSave: (classId: number) => void
  editing: TeacherDB
}

const TeacherModal = ({ open, onCancel, onSave, editing }: Props) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const isEdit = editing ? true : false

  const handleOK = async () => {
    setLoading(true)
    try {
      // dữ liệu từ form (tiếng anh)
      const values: TeacherDto = await form.validateFields()
      console.log("value lấy từ form teacher: ", values)

      await new Promise(resolve => setTimeout(resolve, 1000))
      // const payload = isEdit ? await courseApi.update(editingCourse.ID, values) :
      //   await courseApi.create(values)

      const res = await teacherApi.create(values)
      message.success(isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công')
      onSave(res.data.ID)
      //console.log(res.data)
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

  useEffect(()=>{
    if(open){
      if(editing){
        const formData = mapDataTeacher(editing)
        form.setFieldsValue(formData)
      }
      else 
        form.resetFields()
    }
  },[open, editing, form])

  return (
    <Modal
      title={isEdit ? 'Cập nhật giáo viên' : 'Thêm giáo viên'}
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
        {/* Mã giáo viên, tên giáo viên*/}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item // mã giáo viên
              label="Mã giáo viên"
              name="code"
              rules={[{ required: true, message: 'Vui lòng nhập mã giáo viên!' }]}
            >
              <Input //disabled={isEdit} 
                placeholder="Vd: GV-101..." />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item // tên giáo viên
              label="Tên giáo viên"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên giáo viên!' }]}
            >
              <Input placeholder=" tên giáo viên..." />
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
              <Input type='email' placeholder="VD: vidu@gmail.com" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item // điện thoại
              label="Số điện thoại"
              name="phone"
              rules={[
                { required: true, message: 'Nhập số điện thoại!' },
                {
                  //type: 'regexp', pattern: new RegExp(/\d+/g),
                  type: 'tel',
                  message: 'Nhập đúng số điện thoại có 10 chữ số'
                }
              ]}>

              <Input placeholder='...' />
            </Form.Item>
          </Col>
        </Row>

        {/* Chuyên môn */}
        <Form.Item label="Chuyên môn" name="major">
          <Input.TextArea
            rows={4}
            placeholder="Chuyên môn của giáo viên..."
            showCount
            maxLength={100}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default TeacherModal