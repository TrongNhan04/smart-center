import React, { useState } from 'react';
import { Table, Tag, Typography, Card, Space, Select, DatePicker, Statistic, Row, Col } from 'antd';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const TongHopThuChi = () => {
  // 1. MOCK DATA: Lịch sử giao dịch (Kết hợp cả Thu và Chi)
  const [transactions, setTransactions] = useState([
    {
      id: 'PT-001',
      date: '2026-02-20',
      type: 'INCOME', // Thu
      category: 'Học phí',
      studentName: 'Nguyễn Văn A',
      amount: 5000000,
      method: 'Chuyển khoản',
      note: 'Đóng học phí đợt 1',
    },
    {
      id: 'PT-002',
      date: '2026-02-28',
      type: 'INCOME',
      category: 'Học phí',
      studentName: 'Trần Thị B',
      amount: 3000000,
      method: 'Tiền mặt',
      note: 'Đóng học phí đợt 2',
    },
    {
      id: 'PC-001',
      date: '2026-03-01',
      type: 'EXPENSE', // Chi
      category: 'Hoàn tiền',
      studentName: 'Lê Văn C',
      amount: 1000000,
      method: 'Chuyển khoản',
      note: 'Hoàn tiền do bảo lưu',
    },
    {
      id: 'PC-002',
      date: '2026-03-05',
      type: 'EXPENSE',
      category: 'Khác',
      studentName: '', // Có thể không có liên quan đến học viên
      amount: 500000,
      method: 'Tiền mặt',
      note: 'Mua văn phòng phẩm',
    },
  ]);

  // 2. TÍNH TOÁN THỐNG KÊ (Giả lập)
  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // 3. CỘT CHO BẢNG GIAO DỊCH
  const columns = [
    {
      title: 'Mã GD',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: 'Ngày giao dịch',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      sorter: (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      defaultSortOrder: 'descend' as const, // Mới nhất lên đầu
    },
    {
      title: 'Loại GD',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      filters: [
        { text: 'Phiếu Thu', value: 'INCOME' },
        { text: 'Phiếu Chi', value: 'EXPENSE' },
      ],
      onFilter: (value: any, record: any) => record.type === value,
      render: (type: string) => (
        <Tag color={type === 'INCOME' ? 'success' : 'error'}>
          {type === 'INCOME' ? 'PHIẾU THU' : 'PHIẾU CHI'}
        </Tag>
      ),
    },
    {
      title: 'Học viên / Đối tượng',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (text: string) => text || '--',
    },
    {
      title: 'Nội dung',
      dataIndex: 'note',
      key: 'note',
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      sorter: (a: any, b: any) => a.amount - b.amount,
      render: (val: number, record: any) => {
        const isIncome = record.type === 'INCOME';
        return (
          <strong style={{ color: isIncome ? '#52c41a' : '#ff4d4f', fontSize: 16 }}>
            {isIncome ? '+' : '-'}{val.toLocaleString()} đ
          </strong>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between' }}>
        <Title level={3} style={{ margin: 0 }}>Sổ Quỹ (Thu - Chi)</Title>
        <Space>
           {/* Bộ lọc giả lập cho có vẻ xịn xò */}
          <RangePicker placeholder={['Từ ngày', 'Đến ngày']} />
          <Select defaultValue="all" style={{ width: 120 }}>
            <Select.Option value="all">Tất cả giao dịch</Select.Option>
            <Select.Option value="income">Chỉ Phiếu Thu</Select.Option>
            <Select.Option value="expense">Chỉ Phiếu Chi</Select.Option>
          </Select>
        </Space>
      </Space>

      {/* DASHBOARD THỐNG KÊ NHANH */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bordered={false}>
            <Statistic title="Tổng Thu" value={totalIncome} suffix="đ" valueStyle={{ color: '#52c41a', fontWeight: 'bold' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false}>
            <Statistic title="Tổng Chi" value={totalExpense} suffix="đ" valueStyle={{ color: '#ff4d4f', fontWeight: 'bold' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false}>
            <Statistic title="Tồn Quỹ" value={balance} suffix="đ" valueStyle={{ color: '#1890ff', fontWeight: 'bold' }} />
          </Card>
        </Col>
      </Row>

      {/* BẢNG GIAO DỊCH CHÍNH */}
      <Card bordered={false}>
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          bordered
        />
      </Card>
    </div>
  );
};

export default TongHopThuChi;