import { Alert, Button, Form, Input, InputNumber, message, Modal, notification, Select, Typography } from "antd"
import type { InvoiceDB } from "./InvoiceDTO"
import { useState } from "react"
import { invoiceApi } from "../../api/invoiceApi"

interface Props {
  open: boolean,
  invoice: InvoiceDB
  onCancel: () => void
  onSave: (invoiceId: number) => void,
  isReceipt: boolean
}

const { Text } = Typography

const InvoiceModal = ({ open, onCancel, invoice, onSave, isReceipt }: Props) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  if (!invoice) return
  const DaTra = Number(invoice.DaTra)
  const ConNo = Number(invoice.TongTien) - DaTra

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  const handleOk = async () => {
    setLoading(true)
    try {
      const values = await form.validateFields()
      const { amount, reason } = values
      console.log("values: ", amount)
      await new Promise(resolve => setTimeout(resolve, 1000))

      const res = isReceipt ?
        await invoiceApi.createReceipt(invoice.ID, Number(amount))
        : await invoiceApi.createPayment(invoice.ID, amount, reason)
      message.success('Thao tác thành công')
      onSave(res.data.ID)
      handleCancel()
    } catch (error) {
      handleError(error)
    }
    finally {
      setLoading(false)
    }
  }

  const handleError = (error: any) => {
    notification.error({
      title: 'Có lỗi xảy ra',
      description: error.response.data.message,
      showProgress: true,
      pauseOnHover: true
    })
    console.log("Có lỗi xảy ra", error.response.data.message)
  }

  const handlePayFull = () => {
    form.setFieldValue('amount', isReceipt ? ConNo : DaTra)
  }

  return (
    <Modal
      title={isReceipt ? 'Ghi nhận thu tiền' : 'Ghi nhận hoàn tiền'}
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      okText={isReceipt ? 'Xác nhận thu' : 'Xác nhận hoàn'}
      cancelText="Hủy"
      width={450}
      maskClosable={false}
      confirmLoading={loading}
      okButtonProps={{ danger: !isReceipt }}
    >
      {/* cảnh báo */}
      <Alert
        title={`Đang ${isReceipt ? 'THU' : 'HOÀN'} tiền cho hóa đơn: ${invoice.MaHoaDon}`}
        description={
          isReceipt ? <div>
            Số tiền khách còn nợ: <Text type="danger" strong>
              {ConNo.toLocaleString()} VNĐ</Text>
          </div>
            : <div>
              Số tiền có thể hoàn: <Text type="danger" strong>
                {DaTra.toLocaleString()} VNĐ</Text>
            </div>
        }
        type={isReceipt ? 'info' : 'warning'}
        showIcon
        style={{ marginBottom: 20 }}
      />

      {/* form thông tin */}
      <Form
        form={form} layout="vertical"
        initialValues={{ PhuongThuc: 'CASH' }}>
        <Form.Item //số tiền thu
          label={isReceipt ? "Số tiền thu (VNĐ):" : 'Số tiền hoàn (VNĐ):'}
          name="amount"
          rules={[
            { required: true, message: 'Vui lòng nhập số tiền!' },
            { type: 'number', min: 1000, message: 'Số tiền phải lớn hơn 1.000đ' },
            {
              type: 'number', max: isReceipt ? ConNo : DaTra,
              message: `Không được ${isReceipt ? 'thu' : 'hoàn'} vượt quá ${isReceipt ? ConNo : DaTra}`
            }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            suffix="VNĐ"
            size="large"
          />
        </Form.Item>

        {/* Nút bấm tiện ích đi kèm ngay dưới ô nhập tiền */}
        <div style={{ marginTop: -16, marginBottom: 16, textAlign: 'right' }}>
          <Button type="link" size="small" onClick={handlePayFull}
          >
            Tự động điền mức tối đa ({isReceipt ? 'Thu' : 'Hoàn'} toàn bộ)
          </Button>
        </div>

        <Form.Item // phương thức
          label="Phương thức" name="PhuongThuc"
        >
          <Select
            options={[
              { label: 'Tiền mặt', value: 'CASH' },
              { label: 'Chuyển khoản', value: 'TRANSFER' },
              { label: 'Thẻ', value: 'CARD' }
            ]}>
          </Select>
        </Form.Item>

        {isReceipt ?
          <Form.Item label="Ghi chú" name="note" style={{ flex: 1 }}>
            <Input.TextArea placeholder="VD: ..." />
          </Form.Item>
          :
          <Form.Item //lý do hoàn tiền
            label="Lý do hoàn tiền" name="reason" style={{ flex: 1 }}
            rules={[{ required: true, message: 'Nhập lý do hoàn tiền!' }]}
          >
            <Input.TextArea placeholder="VD: ghi danh nhầm lớp..." />
          </Form.Item>
        }
      </Form>
    </Modal>
  )
}

export default InvoiceModal