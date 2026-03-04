import { useEffect, useState } from 'react'
import {
  Table, Tag, Typography, Card, Space, Statistic, Row, Col,
  notification
} from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import type { GiaoDich } from './InvoiceDTO';
import { invoiceApi } from '../../api/invoiceApi';

const { Title } = Typography

const TongHopThuChi = () => {
  const [transactions, setTransactions] = useState<GiaoDich[]>([])
  const [searchParam, setSearchParam] = useSearchParams()
  const currentPage = Number(searchParam.get('page')) || 1
  const [total, setTotal] = useState()

  const fetchTransactions = async () => {
    try {
      const res = await invoiceApi.getAllReceipt_Payment(currentPage)
      console.log("data: ", res.data.items)
      setTransactions(res.data.items)
      setTotal(res.data.total)
    } catch (error: any) {
      notification.error({
        title: 'Có lỗi xảy ra',
        description: error.response.data.message,
        showProgress: true,
        pauseOnHover: true
      })
      console.log('Có lỗi xảy ra: ', error.response.data.message)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [currentPage])
  // 2. TÍNH TOÁN THỐNG KÊ (Giả lập)
  // const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0)
  // const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0)
  // const balance = totalIncome - totalExpense

  // 3. CỘT CHO BẢNG GIAO DỊCH
  const columns = [
    { // mã giao dịch
      title: 'Mã GD',
      dataIndex: 'maphieu',
      key: 'maphieu',
      width: 100,
    },
    { // ngày giao dịch
      title: 'Ngày giao dịch',
      dataIndex: 'ngay',
      key: 'ngay',
      width: 150,
      sorter: (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      title: 'Loại GD',
      dataIndex: 'loai',
      key: 'loai',
      width: 120,
      filters: [
        { text: 'Phiếu Thu', value: 'RECEIPT' },
        { text: 'Phiếu Chi', value: 'PAYMENT' },
      ],
      onFilter: (value: any, record: any) => record.type === value,
      render: (type: string) => (
        <Tag color={type === 'RECEIPT' ? 'success' : 'error'}>
          {type === 'RECEIPT' ? 'PHIẾU THU' : 'PHIẾU CHI'}
        </Tag>
      ),
    },
    {
      title: 'Học viên',
      dataIndex: 'TenHocVien',
      key: 'TenHocVien',
      render: (text: string) => text || '--',
    },
    {
      title: 'Nội dung',
      dataIndex: 'GhiChu',
      key: 'GhiChu',
    },
    {
      title: 'Số tiền',
      dataIndex: 'SoTien',
      key: 'SoTien',
      align: 'right' as const, // nếu số âm => a đứng trước b và ngược lại
      sorter: (a: any, b: any) => a.amount - b.amount,
      render: (val: number, record: GiaoDich) => {
        const isIncome = record.loai === 'RECEIPT'
        return (
          <strong style={{ color: isIncome ? '#52c41a' : '#ff4d4f', fontSize: 16 }}>
            {isIncome ? '+' : '-'}{Number(val).toLocaleString()} đ
          </strong>
        )
      },
    },
    {
      title: 'Thao tác', dataIndex: 'HoaDonID', key: 'HoaDonID',
      render: (value: number) =>
        <Link to={`/admin/invoices/${value}`}> Xem hóa đơn</Link>
    }
  ]

  return (
    <div
      style={{
        padding: 24,
        background: "#f5f7fa",
        minHeight: "90vh",
      }}
    >
      {/* HEADER + SUMMARY */}
      <Row 
        gutter={[16, 16]} align="middle"
        justify="space-between" style={{ marginBottom: 24 }}
      >
        <Col xs={24} md={8} style={{textAlign:'center'}}>
          <Title level={3} style={{ margin: 0 }}>
            Tổng hợp Thu - Chi
          </Title>
        </Col>

        <Col xs={24} md={16}>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Card variant="borderless">
                <Statistic
                  title="Tổng Thu"
                  value={1000}
                  suffix=" đ"
                  styles={{
                    content: {
                      color: "#52c41a",
                      fontWeight: 600,
                    },
                  }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={8}>
              <Card variant="borderless">
                <Statistic
                  title="Tổng Chi"
                  value={500}
                  suffix=" đ"
                  styles={{
                    content: {
                      color: "#ff4d4f",
                      fontWeight: 600,
                    },
                  }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={8}>
              <Card variant="borderless">
                <Statistic
                  title="Lợi nhuận"
                  value={500}
                  suffix=" đ"
                  styles={{
                    content: {
                      color: "#1890ff",
                      fontWeight: 600,
                    },
                  }}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* BẢNG GIAO DỊCH */}
      <Card variant="borderless">
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="ID"
          pagination={{
            current: currentPage,
            pageSize: 10,
            total:total
          }}
          onChange={(pagination:any) =>
            setSearchParam({ page: pagination.current })
          }
          scroll={{y:350}}
          bordered
        />
      </Card>
    </div>
  )
}

export default TongHopThuChi