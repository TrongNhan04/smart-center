import {
  Row, Col, Card, Statistic, Typography, Tag,
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
import type { EnrollChart, ReveueChart, Summaries } from './DashboardDTO';
import { dashboardApi } from '../../api/dashboardApi';
import { CatchError } from '../common/catch.error';

// Đăng ký các thành phần của Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend)

const { Text, } = Typography

const Dashboard = () => {
  const [sumaries, setSumaries] = useState<Summaries>()
  //const [financeChart, setFinanceChart] = useState<FinanceChart[]>([])
  const [enrollChart, setEnrollChart] = useState<EnrollChart[]>([])
  const [revueneChart, setRevueneChart] = useState<ReveueChart[]>([])

  const fetchDashboard = async () => {
    try {
      const [sumaryRes, chartRes] = await Promise.all([
        dashboardApi.getSumaries(),
        dashboardApi.getCharts(),
      ])
      setSumaries(sumaryRes.data)
      setEnrollChart(chartRes.data.GhiDanh)
      setRevueneChart(chartRes.data.LopHoc)
    } catch (error: any) {
      CatchError.HandleError(error)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const months = enrollChart.map(m => m.Thang) || []
  const classCode = revueneChart.map(item => item.MaLopHoc)
  // biểu đồ các lớp có doanh thu cao
  const revueneData = {
    labels: classCode,
    datasets: [
      {
        label: 'Doanh Thu', data: revueneChart.map(item => item.DoanhThu),
        backgroundColor: '#52c41a'
      },
    ],
  }

  // Data Biểu đồ Ghi danh (Line Chart)
  const enrollData = {
    labels: months,
    datasets: [
      {
        label: 'Ghi danh mới', data: enrollChart.map(m => m.GhiDanhMoi),
        borderColor: '#1890ff', tension: 0.3, fill: false
      }
    ],
  }

  const month = new Date().getMonth() + 1

  return (
    <div style={{ padding: 16, background: '#f0f2f5', minHeight: '91vh' }}>

      {/* 4 thẻ thống kê: học viên, ghi danh, lợi nhuận và công nợ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
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
            <Statistic title={`Ghi danh mới tháng ${month}`}
              value={sumaries?.GhiDanhMoi}
              prefix={<UsergroupAddOutlined />}
              styles={{ content: { color: '#52c41a' } }} />
            <Text type="secondary" style={{ fontSize: 12 }}>Mục tiêu: 50 học viên</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card variant='borderless'
            style={{ borderRadius: 8, background: '#eaffeb' }}>
            <Statistic title={`Lợi nhuận tháng ${month}`}
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

      {/* 2 biểu đồ: doanh thu lớp và ghi danh mới */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="Các lớp có danh thu cao nhất (12 lớp)" variant='borderless'
            style={{ borderRadius: 8, height: '100%' }}
          >
            <Bar data={revueneData} height={300}
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
      <Card
        variant="borderless"
        style={{ borderRadius: 8 }}
        styles={{ body: { padding: '10px 24px' } }}
      >
        <Text strong type='secondary'
          style={{ justifyContent: 'center', marginBottom: 4, display:'flex' }}>
          CHÚ THÍCH MÃ LỚP</Text>
        <Row gutter={[16, 12]} >
          {revueneChart.map((item,index) => (
            <Col xs={24} sm={12} md={8} lg={6} xl={4} key={item.MaLopHoc}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color="blue" style={{ minWidth: 80, textAlign: 'center', margin: 0 }}>
                  {index+1}. {item.MaLopHoc}
                </Tag>
                <Text
                  style={{ fontSize: 13, flex: 1 }}
                  // ellipsis giúp hiện dấu ... khi tên quá dài,
                  // đưa chuột lại gần thì hiện đầy đủ trên tooltip
                  ellipsis={{ tooltip: item.TenLop }}
                >
                  {item.TenLop}
                </Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}

export default Dashboard