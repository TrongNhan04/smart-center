import { useEffect, useState } from "react"
import type { InvoiceDB } from "./InvoiceDTO"
import { Card, Col, Input, Row, Select, Table, Tag, Typography } from "antd"
import { invoiceApi } from "../../api/invoiceApi"
import { CalendarOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons"
import InvoiceAction from "./InvoiceAction"
import InvoiceModal from "./InvoiceModal"
import { Link, useSearchParams } from "react-router-dom"
import { CatchError } from "../common/catch.error"

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
        page: searchText ? 1 : currentPage
      }
      const res = await invoiceApi.findMany(query)
      setInvoices(res.data.items)
      setTotal(res.data.total)
    } catch (error: any) {
      CatchError.HandleError(error)
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

  const changeTablePage = (pagination: any) => {
    setSearchParam({ page: pagination.current })
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
      title: 'Mã HĐ', dataIndex: 'MaHoaDon', width: 120,
      key: 'MaHoaDon', align: 'center' as const,
      render: (code: string) => <Text code>{code}</Text>
    },
    {
      title: 'Ngày phát hành', dataIndex: 'NgayPhatHanh',
      key: 'NgayPhatHanh', width: 150,
      render: (value: string) => <Text >
        <CalendarOutlined style={{ color: '#8c8c8c' }}
        /> {new Date(value).toLocaleDateString()}
      </Text>
    },
    { // tên học viên
      title: 'Học viên', dataIndex: 'TenHocVien', //width: 220,
      key: 'TenHocVien',
      render: (name: string, invoice: InvoiceDB) =>
        <Link to={`/admin/students/${invoice.HocVienID}`}
          style={{ fontWeight: '500' }}>
          <UserOutlined style={{ color: '#8c8c8c' }} /> {name}
        </Link>
    },
    { // học phí
      title: 'Học phí', dataIndex: 'TongTien', key: 'TongTien',
      align: 'right' as const, width: 150,
      render: (total: number) =>
        total ?
          <Text style={{ fontWeight: '500' }}
          >{Number(total).toLocaleString()} </Text>
          : 0
    },
    {
      title: 'Tiền thanh toán', dataIndex: 'DaTra', key: 'DaTra',
      align: 'right' as const, width: 150,
      render: (total: number) =>
        total ?
          <Text style={{ fontWeight: '500' }}
          >{Number(total).toLocaleString()} </Text>
          : 0
    },
    { // ngày hết hạn
      title: 'Hạn thanh toán', dataIndex: 'NgayHetHan',
      key: 'NgayHetHan', width: 160, align: 'center' as const,
      filters: months, // value là value của months
      onFilter: (value: any, invoice: InvoiceDB) =>
        new Date(invoice.NgayHetHan).getMonth() == value,
      render: (value: string) => {
        const dueDate = new Date(value)
        return <Text >
          <CalendarOutlined style={{ color: '#8c8c8c' }}
          /> {dueDate.toLocaleDateString()}
        </Text>
      }
    },
    {// trạng thái
      title: 'Trạng thái', dataIndex: 'TrangThai', key: 'TrangThai', width: 180,
      filters: [
        { text: 'Đã thanh toán', value: 'PAID' },
        { text: 'Thanh toán 1 phần', value: 'PART' },
        { text: 'Chưa thanh toán', value: 'UNPAID' },
        { text: 'Quá hạn', value: 'OVERDATE' },
        { text: 'Đã hủy', value: 'CANCELLED' }
      ],
      onFilter: (value: any, invoice: InvoiceDB) => {
        const { DaTra, TongTien, NgayHetHan, TrangThai } = invoice
        const ConNo = TongTien - DaTra
        const ThoiHan = new Date(NgayHetHan).getTime()
        const isActive = TrangThai === 'ACTIVE'
        if (!isActive) return value === TrangThai // đã hủy
        switch (value) {
          case 'PAID': return DaTra == TongTien // đã trả
          case 'OVERDATE': return ConNo > 0 && now > ThoiHan // quá hạn
          case 'UNPAID': return DaTra == 0 && now < ThoiHan // chưa trả
          default: return ConNo > 0 && now < ThoiHan // 1 phần
        }
      },
      render: (status: string, invoice: InvoiceDB) => {
        const { DaTra, TongTien, NgayHetHan } = invoice
        const ConNo = TongTien - DaTra
        const dueDate = new Date(NgayHetHan).getTime()
        if (status == 'CANCELLED')
          return <Text delete> Đã hủy</Text>
        else if (now > dueDate && ConNo)
          return <Tag color='orange'>Quá hạn</Tag>
        else if (DaTra == TongTien)
          return <Tag color='green'>Đã thanh toán</Tag>
        else if (DaTra == 0)
          return <Tag color='default'>Chưa thanh toán</Tag>
        return <Tag color='processing'>Thanh toán 1 phần</Tag>
      }
    },
    {// thao tác
      title: 'Thao tác', dataIndex: 'action', key: 'action', width: 150,
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
            total: total// tổng từ backend
          }}
          onChange={changeTablePage}
          rowKey="ID"
          scroll={{ x: 'max-content', y: 408 }}
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