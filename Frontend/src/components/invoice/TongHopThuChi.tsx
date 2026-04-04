import { useEffect, useState } from 'react'
import {
  Table, Tag, Typography, Card, Statistic, Row, Col, DatePicker
} from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import type { GiaoDich } from './InvoiceDTO';
import { invoiceApi } from '../../api/invoiceApi';
import dayjs from 'dayjs';
import { UserOutlined } from '@ant-design/icons';
import { CatchError } from '../common/catch.error';

const { Text, Title } = Typography

const TongHopThuChi = () => {
  const [transactions, setTransactions] = useState<GiaoDich[]>([])
  const [searchParam, setSearchParam] = useSearchParams()
  const currentPage = Number(searchParam.get('page')) || 1
  const currentMonth = Number(searchParam.get('month')) || new Date().getMonth()
  const [total, setTotal] = useState()
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const fetchTransactions = async () => {
    try {
      const now = new Date()
      const year = selectedDate ? selectedDate.year() : now.getFullYear()
      const res = await invoiceApi.getTransactions(currentPage, currentMonth, year)
      setTransactions(res.data.items)
      setTotal(res.data.total)
    } catch (error: any) {
      CatchError.HandleError(error)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [currentPage, currentMonth])

  let tongThu = 0
  let tongChi = 0
  for (var item of transactions) {
    if (item.LoaiGD == 'RECEIPT')
      tongThu += Number(item.SoTien)
    else tongChi += Number(item.SoTien)
  }
  const loiNhuan = tongThu - tongChi

  const columns = [
    { // mã giao dịch
      title: 'Mã GD', dataIndex: 'MaGD', key: 'maphieu', width: 100,
    },
    { // ngày giao dịch
      title: 'Ngày giao dịch', dataIndex: 'NgayGD', key: 'NgayGD', width: 150,
      sorter: (a: any, b: any) => new Date(a.NgayGD).getTime() - new Date(b.NgayGD).getTime(),
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    { // loại giao dịch
      title: 'Loại GD', dataIndex: 'LoaiGD', key: 'LoaiGD', width: 120,
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
    { // học viên
      title: 'Học viên', dataIndex: 'TenHocVien', key: 'TenHocVien',
      render: (text: string) =>
        <Text style={{ color: '#187cff', fontWeight: 'bold' }}>
          <UserOutlined /> {text}
        </Text>
    },
    {
      title: 'Nội dung', dataIndex: 'GhiChu', key: 'GhiChu',
    },
    {
      title: 'Số tiền', dataIndex: 'SoTien', key: 'SoTien',
      align: 'right' as const, // nếu số âm => a đứng trước b và ngược lại
      sorter: (a: any, b: any) => a.SoTien - b.SoTien,
      render: (val: number, record: GiaoDich) => {
        const isIncome = record.LoaiGD === 'RECEIPT'
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
    <div style={{ padding: 24, background: "#f5f7fa", minHeight: "90vh" }}>

      {/* HEADER + SUMMARY */}
      <Row
        gutter={[16, 16]} align="middle"
        justify="space-between" style={{ marginBottom: 24 }}
      >
        <Col xs={24} md={8} style={{ textAlign: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>
            Tổng hợp tài chính
          </Title>
          <DatePicker
            picker="month"
            //value={selectedDate}
            format={`MM/YYYY`}
            onChange={(date: any) => {
              setSelectedDate(date);
              setSearchParam({month: date.month()})
            }}
            style={{ marginTop: 8 }}
          />
        </Col>
        
        <Col xs={24} md={16}> 
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Card variant="borderless">
                <Statistic 
                  title="Tổng Thu"
                  value={tongThu}
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
                  value={tongChi}
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
                  value={loiNhuan}
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
            total: total
          }}
          onChange={(pagination: any) =>
            setSearchParam({month:currentMonth.toString(), page: pagination.current })
          }
          scroll={{ y: 350 }}
          bordered
        />
      </Card>
    </div>
  )
}

export default TongHopThuChi