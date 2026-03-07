
import {
  Row, Col, Card, Statistic, Typography, List, Checkbox, Tag, Space,
  notification
} from 'antd';
import {
  UserOutlined, UsergroupAddOutlined, DollarOutlined, WarningOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import type { ClassNotis, FinanceChart, RequestNotis, SessionToday, Summaries, UnsubmitNotis } from './DashboardDTO';
import { dashboardApi } from '../../api/dashboardApi';
import Task from './Task';

// Đăng ký các thành phần của Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend)

const { Title: AntTitle, Text } = Typography

const Dashboard = () => {
  const [sumaries, setSumaries] = useState<Summaries>()
  const [financeChart, setFinanceChart] = useState<FinanceChart[]>([])
  // const [labelChart, setLabelChart] = useState<number[]>([])
  const [sessionsToday, setSessionsToday] = useState<SessionToday[]>([])
  const [classes, setClasses] = useState<ClassNotis[]>([])
  const [requestNotis, setRequestNotis] = useState<RequestNotis[]>([])
  const [unsubmitNotis, setUnsubmitNotis] = useState<UnsubmitNotis[]>([])

  const fetchDashboard = async () => {
    try {
      const [sumaryRes, chartRes, sessionRes, taskRes] = await Promise.all([
        dashboardApi.getSumaries(),
        dashboardApi.getFinanceChart(),
        dashboardApi.getSessions(),
        dashboardApi.getTasks()
      ])
      setSumaries(sumaryRes.data)
      setFinanceChart(chartRes.data)
      setSessionsToday(sessionRes.data)
      setClasses(taskRes.data.LopHoc)
      setRequestNotis(taskRes.data.BuoiHoc.YeuCauMoKhoa)
      setUnsubmitNotis(taskRes.data.BuoiHoc.ChuaSubmit)
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
  const revenueData = {
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
  
  // Data Việc cần làm
  const todos = [classes, requestNotis, unsubmitNotis]

  // ---------------- RENDER UI ----------------
  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* <AntTitle level={3} style={{ marginTop: 0, marginBottom: 24 }}>Tổng quan Trung tâm</AntTitle> */}

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
          <Card title="Doanh thu & Chi phí (6 tháng)" variant='borderless'
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
            <Bar data={revenueData} height={300}
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

      {/* TẦNG 3: VẬN HÀNH (LỊCH HỌC & TODO) */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Lịch học hôm nay" variant='borderless'
            styles={{
              header: { backgroundColor: '#e6f4ff', color: '#0958d9' }
            }}
            style={{ borderRadius: 8 }}>
            <List
              itemLayout="horizontal"
              dataSource={sessionsToday}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Tag color="blue"
                      style={{ padding: '4px 8px', fontSize: 14 }}>
                      <ClockCircleOutlined /> {item.ThoiGian}</Tag>}
                    title={<Text strong>{item.TenLop}</Text>}
                    description={<Space>{item.PhongHoc} | {item.GiaoVien}</Space>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Việc cần làm" variant='borderless'
            styles={{
              header: { backgroundColor: '#fff8e6', color: '#d97109' }
            }}
            style={{ borderRadius: 8 }}>
            
            <Task/>
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
  //     default:
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