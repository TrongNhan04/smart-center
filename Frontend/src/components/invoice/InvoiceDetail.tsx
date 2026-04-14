import {
  CalendarOutlined, ClockCircleFilled, ClockCircleOutlined, LeftOutlined, MoneyCollectOutlined, PhoneOutlined,
  ReadOutlined, RollbackOutlined, UserOutlined
} from "@ant-design/icons";
import {
  Card, Descriptions, Table, Divider, Typography, Row, Col, Statistic,
  Space, Button, Tag,
} from "antd";
import { useEffect, useState } from "react";
import type { GiaoDich, InvoiceDB } from "./InvoiceDTO";
import { invoiceApi } from "../../api/invoiceApi";
import { useNavigate, useParams } from "react-router-dom";
import InvoiceModal from "./InvoiceModal";
import { CatchError } from "../common/catch.error";

const { Title, Text } = Typography

const InvoiceDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<InvoiceDB | null>(null)
  const [transactions, setTransactions] = useState<GiaoDich[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isReceipt, setIsReceipt] = useState(false)
  const invoiceId = Number(id)

  const fetchDetail = async () => {
    try {
      const [invoiceRes, transactionRes] = await Promise.all([
        invoiceApi.findOne(invoiceId),
        invoiceApi.getTransactionsById(invoiceId)
      ])
      setInvoice(invoiceRes.data)
      setTransactions(transactionRes.data)
    } catch (error) {
      CatchError.HandleError(error)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [invoiceId])

  const hanldeAddReceipt = () => {
    setIsOpen(true)
    setIsReceipt(true)
  }

  const handleAddPayment = () => {
    setIsOpen(true)
    setIsReceipt(false)
  }

  if (!invoice) return
  const daTra = invoice.DaTra
  const conNo = invoice.TongTien - invoice.DaTra
  const isCancelled = invoice.TrangThai === 'CANCELLED'

  const receipts: GiaoDich[] = []
  const payments: GiaoDich[] = []
  let tongHoan = 0
  let tongThu = 0

  for (var item of transactions) {
    if (item.LoaiGD === 'RECEIPT') {
      receipts.push(item)
      tongThu += Number(item.SoTien)
    }

    if (item.LoaiGD === 'PAYMENT') {
      payments.push(item)
      tongHoan += Number(item.SoTien)
    }
  }

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

  const method: Record<string, string> = {
    CASH: 'Tiền mặt',
    TRANSFER: 'Chuyển khoản',
    CARD: 'Thẻ'
  }

  const transactionColumns = [
    { // mã giao dịch
      title: 'Mã giao dịch', dataIndex: 'MaGD', key: 'MaGD',
      width: 120, align: 'center' as const
    },
    { // ngày giao dịch
      title: 'Ngày giao dịch', dataIndex: 'NgayGD', key: 'NgayGD', width: 150,
      align: 'center' as const,
      sorter: (a: any, b: any) => new Date(a.NgayGD).getTime() - new Date(b.NgayGD).getTime(),
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    { // loại giao dịch
      title: 'Loại GD', dataIndex: 'LoaiGD', key: 'LoaiGD',
      filters: [
        { text: 'Thu tiền', value: 'RECEIPT' },
        { text: 'Hoàn tiền', value: 'PAYMENT' },
      ],
      onFilter: (value: any, record: GiaoDich) => record.LoaiGD === value,
      render: (type: string) => {
        if (type === 'RECEIPT')
          return <Tag color='green'> THU TIỀN</Tag>
        return <Tag color='red'> HOÀN TIỀN</Tag>
      }
    },
    { // số tiền
      title: 'Số tiền (VNĐ)', dataIndex: 'SoTien', key: 'SoTien',
      align: 'right' as const, width: 200,
      render: (amount: number, record: GiaoDich) => {
        const value = Number(amount)
        const isReceipt = record.LoaiGD === 'RECEIPT'
        let pos = isReceipt ? '+' : "-"
        return <Text strong type={isReceipt ? 'success' : 'danger'}>
          {pos} {value.toLocaleString()} đ
        </Text>
      }
    },
    { // phương thức
      title: 'Phương thức', dataIndex: 'PhuongThuc', key: 'PhuongThuc',
      width: 190,
      render: (value: string) => method[value]
    },
    {
      title: 'Thu ngân', dataIndex: 'ThuNgan', key: 'ThuNgan', width: 220,
      render: (name: string) => <Text><UserOutlined /> {name}</Text>
    },
    {
      title: 'Ghi chú', dataIndex: 'GhiChu', key: 'GhiChu',
      render: (value: string) => !value || '' ? '-' : value
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <Button type="text"
            icon = {<LeftOutlined/>}
            onClick={() => navigate(-1)} />
          <Text style={{ fontSize: 24, fontWeight: '500' }}> HÓA ĐƠN {invoice.MaHoaDon}</Text>
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
          column={3}
          size="middle"
        >
          <Descriptions.Item label="Học viên">
            <Text> <UserOutlined style={{ color: '#8c8c8c' }}
            /> {invoice.TenHocVien}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Ngày phát hành">
            <Text >
              <CalendarOutlined style={{ color: '#1677ff' }}
              /> {new Date(invoice.NgayPhatHanh).toLocaleDateString()}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label="Điện thoại">
            <Text ><PhoneOutlined style={{ color: '#8c8c8c' }}
            /> {invoice.DienThoai}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Lớp học" >
            <Text ><ReadOutlined style={{ color: '#722ed1' }}
            /> {invoice.TenLop}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Hạn thanh toán">
            <Text >
              <CalendarOutlined style={{ color: 'orange' }}
              /> {new Date(invoice.NgayHetHan).toLocaleDateString()}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label="Trạng thái" >
            <Text >{status()}</Text>
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
                  <span
                    style={{
                      textDecoration: isCancelled ? 'line-through' : 'none'
                    }}
                  >
                    {Number(value).toLocaleString()} đ
                  </span>
                )
              }}
            />
          </Col>

          <Col span={6}>
            <Statistic
              title="Đã thu"
              value={tongThu}
              styles={{ content: { color: '#1677ff' } }}
              formatter={(value) => {
                const total = Number(value)
                return total.toLocaleString("vi-VN") + " đ"
              }}
            />
          </Col>

          <Col span={6}>
            <Statistic
              title="Đã hoàn"
              value={tongHoan}
              styles={{ content: { color: '#ff4d4f' } }}
              formatter={(value) => {
                const total = Number(value)
                return total.toLocaleString("vi-VN") + " đ"
              }}
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
              formatter={(value) => value.toLocaleString("vi-VN") + " đ"}
            />
          </Col>
        </Row>
        <Divider />

        {/* Lịch sử giao dịch */}
        <Title level={5}>Lịch sử giao dịch ({transactions.length})</Title>
        <Table
          columns={transactionColumns}
          dataSource={transactions}
          pagination={false}
          bordered
          rowKey="ID"
        />
      </Card>
    </div>
  )
}

export default InvoiceDetail