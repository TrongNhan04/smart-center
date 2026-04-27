import {
  List, Card, Progress, Typography, Space, Tag, Divider,
} from 'antd';
import { TeamOutlined, CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { TeacherClass } from '../class/ClassDTO';
import classApi from '../../api/classApi';
import { CatchError } from '../common/catch.error';

const { Text } = Typography;

const MyClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const fetchMyClass = async () => {
    try {
      const res = await classApi.getByUserId()
      setClasses(res.data)
    } catch (error: any) {
      CatchError.HandleError(error)
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

      <List
        grid={{
          gutter: [24, 8], // Khoảng cách giữa các thẻ
          xs: 1,      // Điện thoại: 1 cột, phân chia = kích cỡ màn hình
          sm: 1,      // Tablet nhỏ: 1 cột
          md: 2,      // Tablet lớn: 2 cột
          lg: 3,      // Desktop: 3 cột
          xl: 3,      // Màn hình rộng: 3 cột
          xxl: 4,     // Màn hình siêu rộng: 4 cột
        }}
        dataSource={classes}
        renderItem={item => {
          const percent = Math.round((item.SoBuoiDaHoc / item.TongSoBuoi) * 100)
          let percentColor = '#ff4d4f' // đỏ
          if (percent > 50) percentColor = '#faad14' //vàng
          if (percent > 80) percentColor = '#52c41a'

          return (
            <List.Item>
              <Card
                styles={{ header: { backgroundColor: '#e6edff' } }}
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
                    <Text ><EnvironmentOutlined style={{color:'#8c8c8c'}}/> {item.PhongHoc ?? '_'}</Text>
                  </Space>

                  <div>
                    <div
                      style={{
                        display: 'flex', justifyContent: 'space-between',
                        marginBottom: 4
                      }}>
                      <Text strong style={{ fontSize: 12 }}>
                        Tiến độ ({item.SoBuoiDaHoc}/{item.TongSoBuoi}) buổi học</Text>
                      <Text strong style={{ fontSize: 12 }}>{percent}%</Text>
                    </div>
                    <Progress
                      percent={percent} 
                      showInfo={false} 
                      strokeColor={percentColor}
                      size="small" />
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