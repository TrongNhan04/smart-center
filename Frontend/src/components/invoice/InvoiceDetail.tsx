import { ArrowLeftOutlined, MoneyCollectOutlined, RollbackOutlined } from "@ant-design/icons";
import {
  Card, Descriptions, Table, Divider, Typography, Row, Col, Statistic,
  Space, Button,
  notification,
  Tag,
} from "antd";
import { useEffect, useState } from "react";
import type { InvoiceDB, PaymentDB, ReceiptDB } from "./InvoiceDTO";
import { invoiceApi } from "../../api/invoiceApi";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import InvoiceModal from "./InvoiceModal";

const { Title, Text } = Typography

const InvoiceDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [invoice, setInvoice] = useState<InvoiceDB | null>(null)
  const [receipts, setReceipts] = useState<ReceiptDB[]>([])
  const [payments, setPayments] = useState<PaymentDB[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isReceipt, setIsReceipt] = useState(false)
  const invoiceId = Number(id)

  const fetchDetail = async () => {
    try {
      const [invoiceRes, receiptRes, paymentRes] = await Promise.all([
        invoiceApi.findOne(invoiceId),
        invoiceApi.getReceipById(invoiceId),
        invoiceApi.getPaymentById(invoiceId)
      ])
      setInvoice(invoiceRes.data)
      setReceipts(receiptRes.data)
      setPayments(paymentRes.data)
    } catch (error) {
      handleError(error)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [invoiceId])

  const handleError = (error: any) => {
    notification.error({
      title: 'Có lỗi xảy ra',
      description: error.response.data.message,
      showProgress: true,
      pauseOnHover: true
    })
    console.log("Có lỗi xảy ra", error.response.data.message)
  }

  const hanldeAddReceipt = () => {
    setIsOpen(true)
    setIsReceipt(true)
  }

  const handleAddPayment = () => {
    setIsOpen(true)
    setIsReceipt(false)
  }

  const handleBack = () => {
    navigate(-1)
    console.log("hello")
  }

  if (!invoice) return
  const daTra = invoice.DaTra
  const conNo = invoice.TongTien - invoice.DaTra
  const isCancelled = invoice.TrangThai === 'CANCELLED'

  const tongThu = receipts.reduce((sum, item) =>
    sum + Number(item.SoTien), 0) || 0

  const tongHoan = payments.reduce((sum, item) =>
    sum + Number(item.SoTien), 0) || 0

  const noKH = tongThu - tongHoan

  const status = () => {
    if (isCancelled)
      return <Text delete>Đã hủy</Text>
    if (daTra == 0)
      return <Tag color="default" >Chưa phát sinh</Tag>
    if (conNo == 0)
      return <Tag color='success'>Đã hoàn thành</Tag>
    return <Tag color={'processing'}>Thanh toán 1 phần</Tag>
  }

  const receiptColumns = [
    {
      title: 'Mã phiếu', dataIndex: 'MaPhieuThu', key: 'MaPhieuThu',
      width: 120, align: 'center' as const
    },
    {
      title: 'Thời gian', dataIndex: 'NgayThu', key: 'NgayThu', width: 150,
      align: 'center' as const,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    { // số tiền thu
      title: 'Số tiền (VNĐ)', dataIndex: 'SoTien', key: 'SoTien',
      align: 'right' as const, width: 200,
      render: (amount: number) => {
        const value = Number(amount)
        return <Text type="success" strong>
          +{value.toLocaleString('vi-VN')}</Text>
      }
    },
    {
      title: 'Phương thức', dataIndex: 'PhuongThuc', key: 'PhuongThuc',
      width: 190,
      // render: () => <Text>Chuyển khoản</Text>
    },
    { title: 'Thu ngân', dataIndex: 'ThuNgan', key: 'ThuNgan', width: 220, },
    {
      title: 'Ghi chú', dataIndex: 'GhiChu', key: 'GhiChu',
      render: (value: string) => !value || '' ? '-' : value
    },
  ]

  const paymentColumns = [
    { // mã phiếu chi
      title: 'Mã phiếu', dataIndex: 'MaPhieuChi', key: 'MaPhieuChi',
      width: 120, align: 'center' as const
    },
    { // thời gian
      title: 'Thời gian', dataIndex: 'NgayChi', key: 'NgayChi',
      width: 150, align: 'center' as const,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    { // số tiền
      title: 'Số tiền (VNĐ)', dataIndex: 'SoTien', key: 'SoTien',
      align: 'right' as const, width: 200,
      render: (amount: number) => {
        const value = Number(amount)
        return <Text type="danger" strong>
          +{value.toLocaleString()}</Text>
      }
    },
    {
      title: 'Phương thức', dataIndex: 'PhuongThuc', key: 'PhuongThuc',
      width: 190,
    },
    { title: 'Thu ngân', dataIndex: 'ThuNgan', key: 'ThuNgan', width: 220, },
    { title: 'Lý do', dataIndex: 'LyDo', key: 'LyDo', ellipsis: true },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>

          <Button icon={<ArrowLeftOutlined />}
            onClick={handleBack}
          > Quay lại</Button>

          <Space>
            {/* <Button icon={<PrinterOutlined />}>In hóa đơn</Button> */}
            <Button type="primary" icon={<MoneyCollectOutlined />}
              onClick={hanldeAddReceipt}
            > Thêm phiếu thu</Button>

            <Button icon={<RollbackOutlined />} danger
              onClick={handleAddPayment} //disabled={!isCancelled}
            >
              Tạo phiếu chi</Button>
          </Space>

          <InvoiceModal
            open={isOpen}
            onCancel={() => setIsOpen(false)}
            invoice={invoice}
            onSave={fetchDetail}
            isReceipt={isReceipt}
          />
        </div>

        <Divider />
        {/* Thông tin hóa đơn */}
        <Descriptions
          bordered
          column={2}
          size="middle"
        >
          <Descriptions.Item label="Học viên">
            <Link to={`/admin/students/${invoice.HocVienID}`}
              style={{ fontWeight: 'bold' }}>{invoice.TenHocVien}</Link>
          </Descriptions.Item>

          <Descriptions.Item label="Số điện thoại">
            <Text >{invoice.DienThoai}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Lớp học" >
            <Text >{invoice.TenLop}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Ngày phát hành">
            <Text strong>
              {new Date(invoice.NgayPhatHanh).toLocaleDateString()}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label="Trạng thái" >
            <Text >{status()}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Hạn thanh toán">
            <Text type="danger" strong>
              {new Date(invoice.NgayHetHan).toLocaleDateString()}
            </Text>
          </Descriptions.Item>
        </Descriptions>
        <Divider />

        {/* Tổng quan thu - chi */}
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Tổng học phí"
              value={invoice.TongTien}
              precision={0}
              formatter={(value) => {
                return (
                  <><span
                    style={{
                      textDecoration: isCancelled ? 'line-through' : 'none'
                    }}
                  >
                    {Number(value).toLocaleString()}
                  </span> đ</>
                )
              }}
            />
          </Col>

          <Col span={6}>
            <Statistic
              title="Đã thu"
              value={tongThu}
              // precision={0}
              styles={{
                content: { color: 'blue' }
              }}
              formatter={(value) => {
                const total = Number(value)
                return total.toLocaleString("vi-VN") + " đ"
              }
              }
            />
          </Col>

          <Col span={6}>
            <Statistic
              title="Đã hoàn"
              value={tongHoan}
              // precision={0}
              styles={{
                content: { color: 'red' }
              }}
              formatter={(value) => {
                const total = Number(value)
                return total.toLocaleString("vi-VN") + " đ"
              }
              }
            />
          </Col>

          <Col span={6}>
            <Statistic
              title={isCancelled ? `Còn nợ khách` : 'Còn lại'}
              value={isCancelled ? noKH : conNo}
              precision={2}
              styles={{
                content: { // nếu đã hủy thì xét còn nợ trên tổng thu - chi
                  color: isCancelled // chưa hủy thì xét tổng tiền - đã trả
                    ? (noKH > 0 ? "orange" : "green")
                    : (conNo > 0 ? "orange" : "green")
                }
              }}
              formatter={(value) =>
                value.toLocaleString("vi-VN") + " đ"
              }
            />
          </Col>
        </Row>

        <Divider />

        {/* Lịch sử phiếu thu */}
        <Title level={5}>Lịch sử thu tiền ({receipts.length})</Title>
        <Table
          columns={receiptColumns}
          dataSource={receipts}
          pagination={false}
          bordered
          rowKey="ID"
        />

        <Divider />

        {/* Lịch sử hoàn tiền */}
        <Title level={5}>Lịch sử hoàn tiền ({payments.length})</Title>
        {10 > 0 ? (
          <Table
            columns={paymentColumns}
            dataSource={payments}
            pagination={false}
            bordered
            rowKey="ID"
          />
        ) : (
          <Text type="secondary">
            Không có phiếu hoàn tiền
          </Text>
        )}

        <Divider />
      </Card>
    </div>
  )
}

export default InvoiceDetail