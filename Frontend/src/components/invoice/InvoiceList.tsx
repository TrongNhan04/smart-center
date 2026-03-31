import { useEffect, useState } from "react"
import type { InvoiceDB } from "./InvoiceDTO"
import {
  Badge, Card, Col, Input, notification, Row, Select, Space, Table, Tag,
  Typography
} from "antd"
import { invoiceApi } from "../../api/invoiceApi"
import {
  CalendarOutlined, CheckCircleOutlined, PhoneOutlined, SearchOutlined,
  UserOutlined
} from "@ant-design/icons"
import InvoiceAction from "./InvoiceAction"
import InvoiceModal from "./InvoiceModal"
import { useSearchParams } from "react-router-dom"

const { Text } = Typography

const InvoiceList = () => {
  const [invoices, setInvoices] = useState<InvoiceDB[]>([])
  const [invoiceId, setInvoiceId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false) // open modal
  const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [invoice, setInvoice] = useState<InvoiceDB | null>(null)
  const [isReceipt, setIsReceipt] = useState(false)

  const [searchParam, setSearchParam] = useSearchParams()
  const currentPage = Number(searchParam.get('page')) || 1
  const [total, setTotal] = useState()

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const query = {
        q: searchText,
        status: filterStatus,
        page: currentPage
      }
      const res = await invoiceApi.findMany(query)
      setInvoices(res.data.items)
      setTotal(res.data.total)
    } catch (error: any) {
      handelError(error)
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [currentPage, filterStatus, searchText])

  const handleSaveModal = (invoiceId: number) => {
    setInvoiceId(invoiceId)
    fetchInvoices()
    setTimeout(() => {
      setInvoiceId(null)
    }, 3000)
  }

  const handelError = (error: any) => {
    notification.error({
      title: 'Có lỗi xảy ra',
      description: error.response.data.message,
      showProgress: true,
      pauseOnHover: true
    })
    console.log('Có lỗi xảy ra: ', error.response.data.message)
  }

  const handleOpenReceipt = (invoice: InvoiceDB) => {
    setIsReceipt(true)
    setIsOpen(true)
    setInvoice(invoice)
  }

  const handleOpenPayment = (invoice: InvoiceDB) => {
    setIsReceipt(false)
    setIsOpen(true)
    setInvoice(invoice)
  }

  const handleChange = (pagination: any) => {
    setSearchParam({ page: pagination.current })
    console.log('page: ', pagination.current)
  }

  const months = [
    { text: "Tháng 1", value: 0 }, { text: "Tháng 2", value: 1 },
    { text: "Tháng 3", value: 2 }, { text: "Tháng 4", value: 3 },
    { text: "Tháng 5", value: 4 }, { text: "Tháng 6", value: 5 },
    { text: "Tháng 7", value: 6 }, { text: "Tháng 8", value: 7 },
    { text: "Tháng 9", value: 8 }, { text: "Tháng 10", value: 9 },
    { text: "Tháng 11", value: 10 }, { text: "Tháng 12", value: 11 },
  ]

  const now = new Date().getTime()
  const columns = [
    { // mã hóa đơn + Ngày phát hành
      title: 'Hóa đơn', dataIndex: 'MaHoaDon',
      key: 'MaHoaDon', align: 'center' as const,
      render: (code: string, invoice: InvoiceDB) =>
        <Space orientation="vertical" size={0}>
          <Text code>{code}</Text>
          <Text type="secondary" style={{ fontSize: '14px', display: 'block', textAlign: 'center' }}>
            {new Date(invoice.NgayPhatHanh).toLocaleDateString()}
          </Text>
        </Space>
    },
    { // tên học viên + SĐT
      title: 'Học viên', dataIndex: 'TenHocVien', //width: 220,
      key: 'TenHocVien', ellipsis: true,
      render: (name: string, invoice: InvoiceDB) =>
        <Space orientation="vertical" size={0}>
          <Text><UserOutlined /> {name}</Text>
          <Text><PhoneOutlined /> {invoice.DienThoai}</Text>
        </Space>
    },
    { // tổng tiền + còn nợ 
      title: 'Số tiền (VNĐ)', dataIndex: 'TongTien', key: 'TongTien',
      render: (total: number, invoice: InvoiceDB) => {
        if (!total) return <Text >0đ</Text>
        const tongTien = Number(total || 0)
        const daTra = Number(invoice.DaTra || 0)
        const conNo = tongTien - daTra
        const isCancelled = invoice.TrangThai === 'CANCELLED'
        let subContent
        let status = 'DEBT' // mặc định là nợ

        if (isCancelled && daTra == 0) status = 'NO_COST' // chưa phát sinh
        else if (isCancelled && daTra > 0) status = 'REFUND' // hoàn tiền
        else if (conNo == 0) status = 'PAID' // hoàn tất

        switch (status) {
          case 'NO_COST':
            subContent = <Text  >Chưa phát sinh</Text>
            break

          case 'REFUND':
            subContent = <Text strong style={{ color: 'blue' }} >
              Cần hoàn: {daTra.toLocaleString()}đ</Text>
            break

          case 'PAID':
            subContent = <Text strong type="success" >
              Đã thu đủ <CheckCircleOutlined /></Text>
            break

          case 'DEBT':
            subContent = <Text strong type="warning" >
              Còn nợ: {conNo.toLocaleString()}đ</Text>
        }

        return (
          <Space orientation="vertical" size={0}>
            <Text strong={!isCancelled}>
              Tổng: {tongTien.toLocaleString()}đ
            </Text>
            {subContent}
          </Space>
        )
      }
    },
    { // ngày hết hạn
      title: 'Hạn thanh toán', dataIndex: 'NgayHetHan',
      key: 'NgayHetHan', width: 160, align: 'center' as const,
      filters: months, // value là value của months
      onFilter: (value: any, invoice: InvoiceDB) =>
        new Date(invoice.NgayHetHan).getMonth() == value,

      render: (invoiceDate: string, invoice: InvoiceDB) => {
        const dueDate = new Date(invoiceDate).getTime()
        const overTime = now - dueDate
        const overDate = Math.floor(overTime / (24 * 60 * 60 * 1000))
        const isCancelled = invoice.TrangThai === 'CANCELLED'

        if (isCancelled) return <Text > <CalendarOutlined />
          {new Date(invoiceDate).toLocaleDateString()}</Text>

        if (overTime > 0 && (invoice.TongTien - invoice.DaTra > 0))
          return <Space orientation="vertical">
            <Text > <CalendarOutlined />
              {new Date(invoiceDate).toLocaleDateString()}</Text>
            <Tag color='red'>Trễ {overDate} ngày</Tag>
          </Space>
        else
          return <Text > <CalendarOutlined />
            {new Date(invoiceDate).toLocaleDateString()}</Text>
      }
    },
    {// trạng thái
      title: 'Trạng thái', dataIndex: 'TrangThai', key: 'TrangThai',
      filters: [
        { text: 'Đã hoàn thành', value: 'Paid' },
        { text: 'Thanh toán 1 phần', value: 'Part' },
        { text: 'Chưa thanh toán', value: 'Unpaid' },
        { text: 'Quá hạn', value: 'OverDate' },
      ],
      onFilter: (value: any, invoice: InvoiceDB) => {
        const { DaTra, TongTien, NgayHetHan, TrangThai } = invoice
        const ConNo = TongTien - DaTra > 0
        const HetHan = new Date(NgayHetHan).getTime()
        const isActive = TrangThai==='ACTIVE'
        switch (value) {
          case 'Paid': return TongTien == DaTra && isActive
          case 'Part': return DaTra > 0 && ConNo && isActive
          case 'Unpaid': return DaTra == 0 && isActive
          case 'OverDate': return now > HetHan && ConNo && isActive
          default:
            return false
        }
      },
      render: (status: string, invoice: InvoiceDB) => {
        const { DaTra, TongTien, NgayHetHan } = invoice
        const ConNo = TongTien - DaTra > 0
        const dueDate = new Date(NgayHetHan).getTime()
        if (status == 'CANCELLED')
          return <Text delete> Đã hủy</Text>
        if (now > dueDate && ConNo)
          return <Badge status="error" text='Quá hạn' />
        if (DaTra == TongTien)
          return <Badge status="success" text='Đã hoàn thành' />
        if (DaTra == 0)
          return <Badge status="default" text='Chưa thanh toán' />
        return <Badge status="processing" text="Thanh toán 1 phần" />
      }
    },
    {// thao tác
      title: 'Thao tác', dataIndex: 'action', key: 'action',
      align: 'center' as const,
      render: (_: any, invoice: InvoiceDB) =>
        <InvoiceAction
          invoice={invoice}
          onAddReceipt={handleOpenReceipt}
          onAddPayment={handleOpenPayment}
        />
    }
  ]

  return (
    <div style={{ padding: 10, background: '#f5f5f5', minHeight: '90vh' }}>
      <Card title={`Danh sách hóa đơn`}
        styles={{
          header: { backgroundColor: '#e6f4ff', color: '#0958d9' }
        }}
      >
        {/* ô tìm kiếm và bộ lọc */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={6}>
            <Input.Search // ô tìm kiếm
              placeholder='Tìm theo tên hoặc mã...'
              prefix={<SearchOutlined />}
              allowClear
              onSearch={(value) => { setSearchText(value) }}
            />
          </Col>

          <Col span={3}>
            <Select // bộ lọc
              placeholder='Trạng thái HĐ'
              style={{ width: '100%' }}
              allowClear
              onChange={(e) => setFilterStatus(e)}
              options={[
                { label: 'Còn hiệu lực', value: 'ACTIVE' },
                { label: 'Đã hủy', value: 'CANCELLED' },
              ]}
            >
            </Select>
          </Col>
          <Col style={{ marginLeft: 'auto' }}>
            Hiển thị:<Text strong> {invoices.length} hóa đơn</Text>
          </Col>
        </Row>
        {/* Bảng hiển thị dữ liệu */}
        <Table
          dataSource={invoices}
          columns={columns}
          loading={loading}
          rowClassName={
            (record) =>
              record.ID === invoiceId ? 'highlight-row' : ''
          }
          //pagination={{ defaultPageSize: 12 }}
          pagination={{
            current: currentPage,
            pageSize: 12,
            total: total
          }}
          onChange={handleChange}
          rowKey="ID"
          scroll={{ x: 1100, y: 408 }}
        />

        {/* Hiển thị Modal UI */}
        <InvoiceModal
          open={isOpen}
          onCancel={() => setIsOpen(false)}
          onSave={handleSaveModal}
          invoice={invoice!}
          isReceipt={isReceipt}
        />
      </Card>
    </div>
  )
}

export default InvoiceList