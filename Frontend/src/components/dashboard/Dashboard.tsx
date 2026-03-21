
import {
  Row, Col, Card, Statistic, Typography, notification
} from 'antd';
import {
  UserOutlined, UsergroupAddOutlined, DollarOutlined, WarningOutlined,
} from '@ant-design/icons';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import type { FinanceChart, Summaries } from './DashboardDTO';
import { dashboardApi } from '../../api/dashboardApi';

// Đăng ký các thành phần của Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend)

const {Text, Title:AntTilte } = Typography

const Dashboard = () => {
  const [sumaries, setSumaries] = useState<Summaries>()
  const [financeChart, setFinanceChart] = useState<FinanceChart[]>([])
  const fetchDashboard = async () => {
    try {
      const [sumaryRes, chartRes] = await Promise.all([
        dashboardApi.getSumaries(),
        dashboardApi.getCharts(),
      ])
      setSumaries(sumaryRes.data)
      setFinanceChart(chartRes.data)
    } catch (error: any) {
      notification.error({
        title: 'Có lỗi xảy ra',
        description: error?.response?.data?.message,
        showProgress: true,
        pauseOnHover: true
      })
      console.log('Có lỗi xảy ra: ', error?.response?.data?.message)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const months = financeChart.map(m => m.Thang) || []

  // Data Biểu đồ Thu - Chi (Bar Chart)
  const thuChiData = {
    labels: months,
    datasets: [
      {
        label: 'Tổng Thu', data: financeChart.map(m => m.TongThu),
        backgroundColor: '#52c41a'
      },
      {
        label: 'Tổng Chi', data: financeChart.map(m => m.TongChi),
        backgroundColor: '#ff4d4f'
      }
    ],
  }

  // Data Biểu đồ Ghi danh (Line Chart)
  const enrollData = {
    labels: months,
    datasets: [
      {
        label: 'Học viên mới', data: financeChart.map(m => m.GhiDanhMoi),
        borderColor: '#1890ff', tension: 0.3, fill: false
      }
    ],
  }

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '91vh' }}>
      <AntTilte level={3} style={{ marginTop: 0, marginBottom: 24 }}>Tổng quan Trung tâm</AntTilte>

      {/* TẦNG 1: 4 THẺ THỐNG KÊ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card variant='borderless' style={{ borderRadius: 8 }}>
            <Statistic title="Học viên đang học"
              value={sumaries?.TongHocVien}
              prefix={<UserOutlined />}
              styles={{ content: { color: '#1890ff' } }} />
            <Text type="secondary" style={{ fontSize: 12 }}>Mục tiêu: 1000 học viên</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card variant='borderless' style={{ borderRadius: 8 }}>
            <Statistic title="Ghi danh mới (Tháng này)"
              value={sumaries?.GhiDanhMoi}
              prefix={<UsergroupAddOutlined />}
              styles={{ content: { color: '#52c41a' } }} />
            <Text type="secondary" style={{ fontSize: 12 }}>Mục tiêu: 50 học viên</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card variant='borderless'
            style={{ borderRadius: 8, background: '#eaffeb' }}>
            <Statistic title="Lợi nhuận (Tháng này)"
              value={sumaries?.LoiNhuan}
              prefix={<DollarOutlined />} suffix="đ"
              styles={{ content: { color: '#149744' } }} />
            <Text type="secondary" style={{ fontSize: 12 }}>Đã trừ các khoản hoàn phí</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card variant='borderless'
            style={{ borderRadius: 8, background: '#fff2f0' }}
          >
            <Statistic title="Công nợ cần thu"
              value={sumaries?.TongNoQuaHan}
              prefix={<WarningOutlined />} suffix="đ"
              styles={{ content: { color: '#cf1322' } }} />

            <a href="/admin/invoices"
              style={{ fontSize: 12, color: '#cf1322', fontWeight: 500 }}>
              Có {sumaries?.HoaDonQuaHan} hóa đơn quá hạn! (Xem ngay)
            </a>
          </Card>
        </Col>
      </Row>

      {/* TẦNG 2: BIỂU ĐỒ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="Doanh thu & Chi phí (12 tháng)" variant='borderless'
            style={{ borderRadius: 8, height: '100%' }}
            // extra={
            //   <Select
            //     allowClear style={{ width: 130 }}
            //     onChange={(handleSelectedMonth)}
            //     options={[
            //       { label: 'Tháng 1 - 6', value: 0 },
            //       { label: 'Tháng 7 - 12', value: 1 },
            //       { label: 'Cả năm', value: 2 }
            //     ]}
            //   />
            // }
          >
            <Bar data={thuChiData} height={300}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Tăng trưởng ghi danh" variant='borderless'
            style={{ borderRadius: 8, height: '100%' }}>
            <Line data={enrollData} height={300}
              options={{ responsive: true, maintainAspectRatio: false }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard

// const handleSelectedMonth = (value: number) => {
  //   switch (value) {
  //     case 0:
  //       return setLabelChart(months?.slice(0, 6) || [])
  //     case 1:
  //       return setLabelChart(months?.slice(6, 12) || [])
  //     case 2:
  //       return setLabelChart(months || [])
  //   }
  // }

  // <List
  //             dataSource={todos}
  //             renderItem={item => (
  //               <List.Item
  //                 style={{
  //                   padding: '12px 16px',
  //                   marginBottom: 10,
  //                   borderRadius: 6,
  //                   //background: item.done ? '#fafafa' : '#fff', // Xong rồi thì nền xám nhạt
  //                   border: '1px solid #f0f0f0',
  //                   // ĐÂY LÀ ĐIỂM NHẤN: Viền trái Đỏ (Gấp), Xanh (Bình thường), Xám (Đã xong)
  //                   // borderLeft: `4px solid ${item.done ? '#d9d9d9' : (item.urgent ? '#ff4d4f' : '#1890ff')}`
  //                   borderLeft: `4px solid #1890ff`
  //                 }}
  //               >
  //                 <Checkbox 
  //                 //defaultChecked={item.done}
  //                 >
  //                   <Text 
  //                   // style={{ color: item.done ? '#bfbfbf' : 'inherit' }}
  //                   >
  //                     {/* {item.task} */}
  //                   </Text>
  //                 </Checkbox>
  //                 {/* {item.urgent && !item.done && <Tag color="error">Gấp</Tag>} */}
  //               </List.Item>
  //             )}
  //           />