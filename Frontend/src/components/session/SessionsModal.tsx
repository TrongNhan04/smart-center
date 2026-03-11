import { Col, DatePicker, Form, Input, message, Modal, notification, Row, TimePicker } from "antd"
import { useState } from "react"
import type { ClassDB } from "../class/ClassDTO"
import { sessionApi } from "../../api/sessionApi"
import type { SessionDto } from "./SessionDTO"
import dayjs from "dayjs"

interface Props {
  lophoc: ClassDB
  open: boolean,
  onCancel: () => void
  onSave: () => void
}

const SessionsModal = ({ lophoc, open, onCancel, onSave }: Props) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  const handleError = (error: any) => {
    notification.error({
      title: 'Có lỗi xảy ra',
      description: error?.response?.data?.message,
      showProgress: true,
      pauseOnHover: true
    })
    console.log("Có lỗi xảy ra", error?.response?.data?.message)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const values: SessionDto = await form.validateFields()
      console.log('values: ', values)
      await new Promise(resolve => setTimeout(resolve, 1000))

      const payload: SessionDto = {
        ...values,
        startAt: dayjs(values.startAt).format('HH:mm'),
        endAt: dayjs(values.endAt).format('HH:mm')
      }
      await sessionApi.generateManual(lophoc.ID, payload)
      message.success('Thao tác thành công')
      // console.log('res.data manualGenarate: ', res.data)
      onSave()
      handleCancel()
    } catch (error: any) {
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
    } finally { setLoading(false) }
  }

  if (!lophoc) return

  return (<>
    {/* Modal */}
    <Modal
      title={`Thêm buổi học - ${lophoc.TenLop}`}
      open={open}
      onCancel={handleCancel}
      width={600}
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
      //initialValues={{ courseId: initCourseId }}
      >
        <Row gutter={16}>
          {/* Cột trái */}
          <Col span={12}>
            <Form.Item //chủ đề
              label="Chủ đề"
              name="topic"
            >
              <Input placeholder="VD: Thì hiện tại đơn..." />
            </Form.Item>

            <Form.Item //phòng học
              label="Phòng học"
              name="room"
            >
              <Input placeholder="VD: A010..." />
            </Form.Item>
          </Col>

          {/* Cột phải */}
          <Col span={12}>
            <Form.Item // ngày học
              label="Ngày học"
              name="date"
              rules={[{ required: true, message: 'Vui lòng chọn ngày học!' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
              // placeholder={['Từ ngày', 'Đến ngày']}
              />
            </Form.Item>

            <Row gutter={8}>
              <Col span={12}>
                <Form.Item // bắt đầu lúc
                  label="Bắt đầu lúc"
                  name="startAt"
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
                <Form.Item // kết thúc lúc
                  label="Kết thúc lúc"
                  name="endAt"
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
          </Col> {/* kết thúc cột phải */}

        </Row>
        <Form.Item label="Mô tả" name="description">
          <Input.TextArea
            rows={4}
            placeholder="VD: nội dung bài học..."
            showCount
            maxLength={500}
          />
        </Form.Item>
      </Form>
    </Modal>
  </>)
}

export default SessionsModal