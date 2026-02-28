// import React from 'react';
// import { 
//   Card, Descriptions, Table, Tag, Button, Space, 
//   Typography, Row, Col, Divider, Statistic 
// } from 'antd';
// import { 
//   ArrowLeftOutlined, PrinterOutlined, PlusOutlined, 
//   MoneyCollectOutlined, RollbackOutlined 
// } from '@ant-design/icons';

// const { Title, Text } = Typography;

// // ==========================================
// // 1. MOCK DATA (Dữ liệu giả lập)
// // ==========================================

// const mockInvoice = {
//   id: 'HD-20260228-001',
//   studentName: 'Nguyễn Văn A',
//   studentPhone: '0901234567',
//   className: 'IELTS Intensive 01',
//   issueDate: '28/02/2026',
//   dueDate: '05/03/2026',
//   status: 'PARTIAL', // OPEN, PARTIAL, COMPLETED, OVERDUE, CANCELLED
  
//   // Các con số tài chính
//   totalAmount: 15000000,
//   totalPaid: 10000000,
//   totalRefunded: 0,
//   balance: 5000000, // Còn nợ
  
//   note: 'Học viên xin đóng đợt 1 trước 10 triệu.',
// };

// const mockReceipts = [
//   { id: 'PT-001', date: '28/02/2026 09:15', amount: 5000000, method: 'Chuyển khoản', cashier: 'Trần Thị B', note: 'Đóng đợt 1' },
//   { id: 'PT-002', date: '01/03/2026 14:30', amount: 5000000, method: 'Tiền mặt', cashier: 'Trần Thị B', note: 'Đóng đợt 2' },
// ];

// const mockPayments = [
//   // Nếu có phiếu chi (hoàn tiền) thì nằm ở đây. Tạm thời mảng rỗng.
// ];

// // Hàm format tiền tệ VNĐ
// const formatVND = (money: number) => 
//   new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(money);

// // ==========================================
// // 2. COMPONENT CHÍNH
// // ==========================================

// const InvoiceDetail: React.FC = () => {
  
//   // Cấu hình cột cho bảng Phiếu Thu
//   const receiptColumns = [
//     { title: 'Mã PT', dataIndex: 'id', key: 'id', width: 120 },
//     { title: 'Thời gian', dataIndex: 'date', key: 'date', width: 150 },
//     { 
//       title: 'Số tiền', 
//       dataIndex: 'amount', 
//       key: 'amount',
//       render: (val: number) => <Text type="success" strong>+{formatVND(val)}</Text>
//     },
//     { title: 'Phương thức', dataIndex: 'method', key: 'method' },
//     { title: 'Thu ngân', dataIndex: 'cashier', key: 'cashier' },
//     { title: 'Ghi chú', dataIndex: 'note', key: 'note' },
//   ];

//   // Cấu hình cột cho bảng Phiếu Chi (Hoàn tiền)
//   const paymentColumns = [
//     { title: 'Mã PC', dataIndex: 'id', key: 'id', width: 120 },
//     { title: 'Thời gian', dataIndex: 'date', key: 'date', width: 150 },
//     { 
//       title: 'Số tiền', 
//       dataIndex: 'amount', 
//       key: 'amount',
//       render: (val: number) => <Text type="danger" strong>-{formatVND(val)}</Text>
//     },
//     { title: 'Phương thức', dataIndex: 'method', key: 'method' },
//     { title: 'Người chi', dataIndex: 'cashier', key: 'cashier' },
//     { title: 'Lý do', dataIndex: 'note', key: 'note' },
//   ];

//   return (
//     <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      
//       {/* KHU VỰC 1: HEADER & NÚT THAO TÁC */}
//       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
//         <Space align="center">
//           <Button icon={<ArrowLeftOutlined />} type="text" />
//           <Title level={3} style={{ margin: 0 }}>Hóa đơn {mockInvoice.id}</Title>
//           <Tag color="warning" style={{ fontSize: 14, padding: '4px 8px', marginLeft: 8 }}>
//             Thanh toán một phần
//           </Tag>
//         </Space>
        
//         <Space>
//           <Button icon={<PrinterOutlined />}>In hóa đơn</Button>
//           <Button icon={<RollbackOutlined />} danger>Tạo phiếu chi</Button>
//           <Button type="primary" icon={<MoneyCollectOutlined />}>Thu thêm tiền</Button>
//         </Space>
//       </div>

//       {/* KHU VỰC 2: THỐNG KÊ TÀI CHÍNH NHANH */}
//       <Row gutter={16} style={{ marginBottom: 24 }}>
//         <Col span={6}>
//           <Card variant={'borderless'} size="small">
//             <Statistic title="Tổng tiền hóa đơn" value={mockInvoice.totalAmount} formatter={(v) => formatVND(v as number)} />
//           </Card>
//         </Col>
//         <Col span={6}>
//           <Card variant={'borderless'} size="small">
//             <Statistic title="Đã thanh toán" value={mockInvoice.totalPaid} valueStyle={{ color: '#3f8600' }} formatter={(v) => formatVND(v as number)} />
//           </Card>
//         </Col>
//         <Col span={6}>
//           <Card variant={'borderless'} size="small">
//             <Statistic title="Đã hoàn tiền (Phiếu chi)" value={mockInvoice.totalRefunded} valueStyle={{ color: '#cf1322' }} formatter={(v) => formatVND(v as number)} />
//           </Card>
//         </Col>
//         <Col span={6}>
//           <Card variant={'borderless'} size="small" style={{ background: '#fff1f0', border: '1px solid #ffa39e' }}>
//             <Statistic title="Khách còn nợ" value={mockInvoice.balance} valueStyle={{ color: '#cf1322', fontWeight: 'bold' }} formatter={(v) => formatVND(v as number)} />
//           </Card>
//         </Col>
//       </Row>

//       {/* KHU VỰC 3: THÔNG TIN CHI TIẾT */}
//       <Card title="Thông tin chung" variant={'borderless'} style={{ marginBottom: 24 }}>
//         <Descriptions column={3}>
//           <Descriptions.Item label="Học viên"><Text strong>{mockInvoice.studentName}</Text></Descriptions.Item>
//           <Descriptions.Item label="Số điện thoại">{mockInvoice.studentPhone}</Descriptions.Item>
//           <Descriptions.Item label="Lớp học">{mockInvoice.className}</Descriptions.Item>
          
//           <Descriptions.Item label="Ngày phát hành">{mockInvoice.issueDate}</Descriptions.Item>
//           <Descriptions.Item label="Hạn thanh toán">
//             <Text type="danger">{mockInvoice.dueDate}</Text>
//           </Descriptions.Item>
//           <Descriptions.Item label="Ghi chú">{mockInvoice.note || '--'}</Descriptions.Item>
//         </Descriptions>
//       </Card>

//       {/* KHU VỰC 4: LỊCH SỬ DÒNG TIỀN (TABS HOẶC DANH SÁCH DỌC) */}
//       <Card title="Lịch sử thu tiền (Phiếu thu)" variant={'borderless'} style={{ marginBottom: 24 }}>
//         <Table 
//           dataSource={mockReceipts} 
//           columns={receiptColumns} 
//           pagination={false}
//           rowKey="id"
//           size="middle"
//         />
//       </Card>

//       <Card title="Lịch sử hoàn tiền (Phiếu chi)" variant={'borderless'}>
//         <Table 
//           //dataSource={mockPayments} 
//           columns={paymentColumns} 
//           pagination={false}
//           rowKey="id"
//           size="middle"
//           locale={{ emptyText: 'Chưa có dữ liệu hoàn tiền nào' }}
//         />
//       </Card>

//     </div>
//   );
// };

// export default InvoiceDetail;

import { Card, Descriptions, Table, Tag, Typography, Divider, Space, Button } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons';

const { Title } = Typography;

const InvoiceDetail = () => {
  // 1. MOCK DATA: Thông tin Hóa đơn (Học phí)
  const invoiceData = {
    invoiceCode: 'HD-20260228-001',
    studentName: 'Nguyễn Văn A',
    courseName: 'IELTS 7.0 - Lớp Tối 246',
    totalAmount: 10000000, // 10 triệu
    paidAmount: 7000000,   // Đã đóng 7 triệu
    debtAmount: 3000000,   // Còn nợ 3 triệu
    status: 'PARTIAL',     // Thu một phần
    createdAt: '28/02/2026 10:00',
  };

  // 2. MOCK DATA: Danh sách Phiếu thu (Tiền học viên đóng)
  const receiptsMock = [
    { id: 'PT-001', date: '20/02/2026', amount: 5000000, method: 'Chuyển khoản', note: 'Đóng đợt 1' },
    { id: 'PT-002', date: '28/02/2026', amount: 2000000, method: 'Tiền mặt', note: 'Đóng đợt 2' },
  ];

  // 3. MOCK DATA: Danh sách Phiếu chi (Hoàn tiền học phí - Nếu có)
  const paymentsMock = [
    // Bỏ comment dòng dưới để test trường hợp có phiếu chi
    { id: 'PC-001', date: '05/03/2026', amount: 1000000, reason: 'Hoàn tiền do bảo lưu', status: 'Đã chi' }
  ];

  // --- CẤU HÌNH CỘT CHO BẢNG ---
  const receiptColumns = [
    { title: 'Mã PT', dataIndex: 'id', key: 'id', width: 100 },
    { title: 'Ngày thu', dataIndex: 'date', key: 'date', width: 150 },
    { title: 'Hình thức', dataIndex: 'method', key: 'method', width: 120 },
    { title: 'Nội dung', dataIndex: 'note', key: 'note' },
    { 
      title: 'Số tiền', 
      dataIndex: 'amount', 
      key: 'amount', 
      align: 'right' as const,
      render: (val: number) => <strong style={{ color: '#52c41a' }}>+{val.toLocaleString()} đ</strong> 
    },
  ];

  const paymentColumns = [
    { title: 'Mã PC', dataIndex: 'id', key: 'id', width: 100 },
    { title: 'Ngày chi', dataIndex: 'date', key: 'date', width: 150 },
    { title: 'Lý do chi', dataIndex: 'reason', key: 'reason' },
    { 
      title: 'Số tiền', 
      dataIndex: 'amount', 
      key: 'amount', 
      align: 'right' as const,
      render: (val: number) => <strong style={{ color: '#ff4d4f' }}>-{val.toLocaleString()} đ</strong> 
    },
  ];

  // Logic render màu trạng thái hóa đơn
  const renderStatus = (status: string) => {
    if (status === 'PAID') return <Tag color="success">Đã thanh toán đủ</Tag>;
    if (status === 'PARTIAL') return <Tag color="warning">Thu một phần</Tag>;
    return <Tag color="error">Chưa thanh toán</Tag>;
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* HEADER TÙY CHỈNH */}
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} type="text">Quay lại</Button>
          <Title level={4} style={{ margin: 0 }}>Chi tiết hóa đơn {invoiceData.invoiceCode}</Title>
        </Space>
        <Button icon={<PrinterOutlined />} type="primary">In hóa đơn</Button>
      </Space>

      {/* PHẦN 1: THÔNG TIN HÓA ĐƠN */}
      <Card bordered={false} style={{ marginBottom: 24 }}>
        <Descriptions title="Thông tin chung" bordered column={{ xxl: 3, xl: 3, lg: 2, md: 1, sm: 1, xs: 1 }}>
          <Descriptions.Item label="Học viên"><strong>{invoiceData.studentName}</strong></Descriptions.Item>
          <Descriptions.Item label="Khóa học">{invoiceData.courseName}</Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">{invoiceData.createdAt}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái" span={3}>
            {renderStatus(invoiceData.status)}
          </Descriptions.Item>
          
          <Descriptions.Item label="Tổng tiền (Phải thu)">
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>{invoiceData.totalAmount.toLocaleString()} đ</span>
          </Descriptions.Item>
          <Descriptions.Item label="Đã thu">
            <span style={{ fontSize: 16, color: '#52c41a', fontWeight: 'bold' }}>{invoiceData.paidAmount.toLocaleString()} đ</span>
          </Descriptions.Item>
          <Descriptions.Item label="Còn nợ">
            <span style={{ fontSize: 16, color: '#ff4d4f', fontWeight: 'bold' }}>{invoiceData.debtAmount.toLocaleString()} đ</span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* PHẦN 2: LỊCH SỬ GIAO DỊCH (PHIẾU THU / PHIẾU CHI) */}
      <Card title="Lịch sử giao dịch" bordered={false}>
        
        {/* Bảng Phiếu Thu */}
        <div style={{ marginBottom: paymentsMock.length > 0 ? 32 : 0 }}>
          <Typography.Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
            Lịch sử thu tiền ({receiptsMock.length} lần)
          </Typography.Text>
          <Table 
            dataSource={receiptsMock} 
            columns={receiptColumns} 
            rowKey="id" 
            pagination={false} 
            size="small"
            bordered
          />
        </div>

        {/* Bảng Phiếu Chi (Chỉ hiển thị nếu mảng paymentsMock có dữ liệu) */}
        {paymentsMock.length > 0 && (
          <>
            <Divider dashed />
            <div>
              <Typography.Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
                Lịch sử hoàn/chi tiền ({paymentsMock.length} lần)
              </Typography.Text>
              <Table 
                dataSource={paymentsMock} 
                columns={paymentColumns} 
                rowKey="id" 
                pagination={false} 
                size="small"
                bordered
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default InvoiceDetail;