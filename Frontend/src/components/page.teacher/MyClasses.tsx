import { List, Card, Progress, Button, Typography, Space, Tag, Divider, Row, Col, notification } from 'antd';
import { TeamOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { TeacherClass } from '../class/ClassDTO';
import classApi from '../../api/classApi';

const { Text, Title } = Typography;

const MyClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const fetchMyClass = async () => {
    try {
      const res = await classApi.getByUserId()
      setClasses(res.data)
    } catch (error: any) {
      notification.error({
        title: 'Có lỗi xảy ra',
        description: error.response.data.message,
        showProgress: true,
        pauseOnHover: true
      })
      console.log("Có lỗi xảy ra", error.response.data.message)
    }
  }

  useEffect(() => {
    fetchMyClass()
  }, [])

  const statusColor: Record<string, { text: string, color: string }> = {
    OPEN: { text: 'Tuyển sinh', color: 'default' },
    RUNNING: { text: 'Đang hoạt động', color: 'processing' },
    CLOSED: { text: 'Đã đóng', color: 'error' }
  }

  const mapSchedule = (value: number[]) => {
    const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    return value.map(item => dow[item]).join('-')
  }

  return (
    <div style={{ padding: 20, background: '#f0f2f5', minHeight: '91vh' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Lớp học của tôi</Title>
          {/* <Text type="secondary">Bạn đang phụ trách {classes.length} lớp học</Text> */}
        </Col>
      </Row>

      <List
        grid={{
          gutter: [24, 8], // Khoảng cách giữa các thẻ
          xs: 1,      // Điện thoại: 1 cột
          sm: 1,      // Tablet nhỏ: 1 cột
          md: 2,      // Tablet lớn: 2 cột
          lg: 3,      // Desktop: 3 cột
          xl: 3,
          xxl: 4,     // Màn hình siêu rộng: 4 cột
        }}
        dataSource={classes}
        renderItem={item => {
          const percent = Math.round((item.BuoiDaHoc / item.TongSoBuoi) * 100);

          return (
            <List.Item>
              <Card
                styles={{ header: { backgroundColor: '#f0f5ff'}}}
                hoverable
                onClick={() => navigate(`/teacher/classes/${item.ID}`)}

                title={
                  <Space orientation="vertical" size={0}>
                    <Text type="secondary" style={{ color: '#8c8c8c' }}>
                      {item.MaLopHoc}
                    </Text>
                    <Text style={{ color: '#1d39c4' }}>{item.TenLop}</Text>
                  </Space>
                }
              > {/* kết thúc phần xử lý title của card */}

                {/* thẻ <Space> để dàn hàng */}
                <Space orientation="vertical" size="middle"
                  style={{ width: '100%' }}>

                  <Space>
                    <CalendarOutlined style={{ color: '#8c8c8c' }} />
                    <Text>{mapSchedule(item.LichHoc)}</Text>
                    <Tag color={statusColor[item.TrangThai].color}>
                      {statusColor[item.TrangThai].text}
                    </Tag>
                  </Space>

                  <Space separator={<Divider orientation="vertical" />}>
                    <Space>
                      <TeamOutlined style={{ color: '#8c8c8c' }} />
                      <Text>{item.TongGhiDanh} học viên</Text>
                    </Space>
                    <Text type="secondary">{item.PhongHoc}</Text>
                  </Space>

                  <div>
                    <div
                      style={{
                        display: 'flex', justifyContent: 'space-between',
                        marginBottom: 4
                      }}>
                      <Text strong style={{ fontSize: 12 }}>
                        Tiến độ ({item.BuoiDaHoc}/{item.TongSoBuoi})</Text>
                      <Text strong style={{ fontSize: 12 }}>{percent}%</Text>
                    </div>
                    <Progress percent={percent} showInfo={false} size="small" />
                  </div>

                </Space>
              </Card>
            </List.Item>
          );
        }}
      />
    </div>
  );
};

export default MyClasses;