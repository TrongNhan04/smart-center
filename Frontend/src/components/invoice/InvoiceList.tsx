import { useEffect, useState } from "react"
import type { InvoiceDB } from "./InvoiceDTO"
import { Card, Col, Input, notification, Progress, Row, Select, Space, Table, Tag, Typography } from "antd"
import { invoiceApi } from "../../api/invoiceApi"
import { Link } from "react-router-dom"
import { CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationOutlined, PhoneOutlined, SearchOutlined } from "@ant-design/icons"

const { Text } = Typography

const InvoiceList = () => {
  const [invoices, setInvoices] = useState<InvoiceDB[]>([])
  const [invoiceId, setInvoiceId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  //const [isOpen, setIsOpen] = useState(false) // open modal
  const [filterStatus, setFilterStatus] = useState('')

  const handelError = (error: any) => {
    notification.error({
      title: 'Có lỗi xảy ra',
      description: error.response.data.message,
      showProgress: true,
      pauseOnHover: true
    })
    console.log('Có lỗi xảy ra: ', error.response.data.message)
  }

  const fetchInvoices = async (keyword: string) => {
    setLoading(true)
    try {
      const res = await invoiceApi.findMany(keyword, filterStatus)
      setInvoices(res.data)
    } catch (error: any) {
      handelError(error)
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices('')
  }, [filterStatus])

  const handleSaveModal = (invoiceId: number) => {
    console.log('invoiceId: ', invoiceId)
    setInvoiceId(invoiceId)
    fetchInvoices('')
    setTimeout(() => {
      setInvoiceId(null)
    }, 3000)
  }

  const months = [
    { text: "Tháng 1", value: 0 }, { text: "Tháng 2", value: 1 },
    { text: "Tháng 3", value: 2 }, { text: "Tháng 4", value: 3 },
    { text: "Tháng 5", value: 4 }, { text: "Tháng 6", value: 5 },
    { text: "Tháng 7", value: 6 }, { text: "Tháng 8", value: 7 },
    { text: "Tháng 9", value: 8 }, { text: "Tháng 10", value: 9 },
    { text: "Tháng 11", value: 10 }, { text: "Tháng 12", value: 11 },
  ]

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
        <Space orientation="vertical">
          <Link to={`/admin/students/${invoice.HocVienID}`}
            style={{ fontWeight: 'bold' }}>{name}</Link>
          <Text><PhoneOutlined /> {invoice.DienThoai}</Text>
        </Space>
    },
    { // tổng tiền + còn nợ 
      title: 'Số tiền', dataIndex: 'TongTien', key: 'TongTien',
      render: (total: number, invoice: InvoiceDB) => {
        if (!total) return <Text >0 đ</Text>
        const value = Number(total).toLocaleString('vi-VN')
        const debt = (total - invoice.DaTra).toLocaleString('vi-VN')
        return <Space orientation="vertical" size={0}>
          <span><Text strong>Tổng: </Text>{value} đ</span>
          <span><Text strong>Nợ: </Text> {debt} đ</span>
        </Space>
      }
    },
    { // ngày hết hạn
      title: 'Hạn thanh toán', dataIndex: 'NgayHetHan',
      key: 'NgayHetHan', width: 160, align: 'center' as const,
      filters: [
        { text: 'Còn hạn', value: 'ConHan' },
        { text: 'Quá hạn', value: 'QuaHan' }
      ],
      onFilter: (value: any, invoice: InvoiceDB) => {
        const now = new Date().getTime()
        const dueDate = new Date(invoice.NgayHetHan).getTime()
        if (value === 'ConHan')
          return dueDate > now
        if (value === 'QuaHan')
          return dueDate <= now
        return false
      },
      render: (invoiceDate: string, invoice: InvoiceDB) => {
        const now = new Date().getTime()
        const dueDate = new Date(invoiceDate).getTime()
        const overTime = now - dueDate
        const overDate = Math.floor(overTime / (24 * 60 * 60 * 1000))
        if (overTime > 0 && (invoice.TongTien - invoice.DaTra > 0))
          return <Space orientation="vertical">
            <Text > <CalendarOutlined />
              {new Date(invoiceDate).toLocaleDateString()}</Text>
            <Tag color='red'>Trễ {overDate} ngày</Tag>
          </Space>
        else
          return <Text >
            <CalendarOutlined /> {new Date(invoiceDate).toLocaleDateString()}</Text>
      }
    },
    {

    }
  ]

  return (
    <Card title={`Danh sách hóa đơn`}>
      {/* ô tìm kiếm và bộ lọc */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Input.Search // ô tìm kiếm
            placeholder='Tìm theo tên hoặc mã...'
            prefix={<SearchOutlined />}
            allowClear
            onSearch={fetchInvoices}
          />
        </Col>

        <Col span={3}>
          <Select // bộ lọc
            placeholder='Trạng thái'
            style={{ width: '100%' }}
            allowClear
            onChange={(e) => setFilterStatus(e)}
            options={[
              { label: 'Thành công', value: 'ACTIVE' },
              { label: 'Đã hủy', value: 'CANCELLED' },
            ]}
          >
          </Select>
        </Col>
      </Row>
      {/* Bảng hiển thị dữ liệu */}
      <Table
        dataSource={invoices}
        columns={columns}
        loading={loading}
        rowClassName={
          (record) => {
            return record.ID === invoiceId ? 'highlight-row' : ''
          }
        }
        pagination={{ defaultPageSize: 12 }}
        rowKey="ID"
        scroll={{ x: 1100, y: 426 }}
      />

      {/* Hiển thị Modal UI */}
      {/* <invoiceModal
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        onSave={handleSaveModal}
      /> */}
    </Card>
  )
}

export default InvoiceList