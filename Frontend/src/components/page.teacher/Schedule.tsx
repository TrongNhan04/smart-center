import { useEffect, useState } from 'react';
import { Card, Typography, Button, Space, Tag, Row, Col, notification } from 'antd';
import { LeftOutlined, RightOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi'; // Import tiếng Việt cho dayjs
import type { ScheduleOW } from '../session/SessionDTO';
import teacherApi from '../../api/teacherApi';

// Cài đặt ngôn ngữ tiếng Việt để thứ 2 là ngày đầu tuần
dayjs.locale('vi');

const { Title, Text } = Typography;

const Schedule = () => {
  //lưu ngày bắt đầu của tuần này
  const [startOfWeek, setStartOfWeek] = useState<Dayjs>(dayjs().startOf('week'));
  const [scheduleOW, setScheduleOW] = useState<ScheduleOW[]>([])

  const fetchSchedule = async () => {
    try {
      const startDate = startOfWeek.toISOString()
      const endDate = startOfWeek.add(1, 'week').toISOString()
      const res = await teacherApi.getSchedule(startDate, endDate)
      setScheduleOW(res.data)
      // console.log(res.data)
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
    fetchSchedule()
  }, [startOfWeek])

  // nút chọn tuần này
  const handleToday = () => setStartOfWeek(dayjs().startOf('week'))
  // nút chọn tuần tới dựa vào state cũ
  const handleNextWeek = () => setStartOfWeek(prev => prev.add(1, 'week'))
  // nút chọn tuần trước dựa vào state cũ
  const handlePrevWeek = () => setStartOfWeek(prev => prev.subtract(1, 'week'))

  // tạo mảng 7 ngày cho tuần hiện tại
  const weekDays = Array.from({ length: 7 }).map((_, index) => startOfWeek.add(index, 'day'))

  // tìm buổi học theo ngày
  const getClassesForDay = (date: Dayjs) => {
    const a = scheduleOW.filter(item => item.NgayHoc === date.format('YYYY-MM-DD'))
    console.log(scheduleOW)
    console.log(date.format('YYYY-MM-DD'))
    return a
  }

  return (
    <div style={{ padding: 16, background: '#f0f2f5', minHeight: '90vh' }}>

      {/* Tiêu đề và các nút chuyển tuần */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Lịch dạy theo tuần</Title>
        <Space>
          <Button onClick={handleToday}>Tuần này</Button>
          <Button icon={<LeftOutlined />} onClick={handlePrevWeek} />
          {/* Hiển thị khoảng thời gian: Từ ngày... đến ngày... */}
          <Text strong style={{ fontSize: 16, margin: '0 8px' }}>
            {/* từ t2 -> cn thì cộng thêm 6 ngày */}
            {startOfWeek.format('DD/MM')} - {startOfWeek.add(6, 'day').format('DD/MM/YYYY')}
          </Text>
          <Button icon={<RightOutlined />} onClick={handleNextWeek} />
        </Space>
      </div>

      {/* body: tạo 7 thẻ từ thứ 2 đến chủ nhật */}
      <div
        style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: 16 }}>
        {/* day là 1 ngày của weekDays, index là id cho Card */}
        {weekDays.map((day, index) => {
          const dailyClasses = getClassesForDay(day);
          // console.log(day.format('YYYY-MM-DD'))
          const isToday = day.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');

          return (
            <Card
              key={index}
              title={
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 14, fontWeight: 'normal',
                    color: isToday ? '#1890ff' : '#8c8c8c'
                  }}>{/* dddd trả về tên đầy đủ của ngày trong tuần, vd thứ 2, 3,.. */}
                    {day.format('dddd')}
                  </div>

                  <div style={{
                    fontSize: 24, fontWeight: isToday ? 'bold' : 'normal',
                    color: isToday ? '#1890ff' : '#262626'
                  }}>{/* DD trả về ngày trong tháng, vd 1,2,3,...*/}
                    {day.format('DD')}
                  </div>
                </div>
              }
              variant='borderless'
              style={{
                flex: '1 1 0', // Ép 7 cột chia đều không gian
                minWidth: '180px', 
                minHeight: '100px',
                borderRadius: 8,
                borderTop: isToday ? '4px solid #1890ff'
                  : '4px solid transparent', // Highlight ngày hôm nay
              }}

              styles={{
                body: {
                  padding: '12px', minHeight: '400px',
                  backgroundColor: isToday ? '#e6f7ff' : '#fff'
                }
              }}
            >
              {dailyClasses.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#bfbfbf', marginTop: 20, fontSize: 12 }}>
                  Trống lịch
                </div>
              ) : (
                <Space orientation="vertical" style={{ width: '100%' }}>
                  {dailyClasses.map(lophoc => (
                    // Thẻ Card nhỏ đại diện cho 1 ca học
                    <div
                      key={lophoc.ID}
                      style={{
                        padding: 8,
                        backgroundColor: lophoc.TrangThai === 'CANCELLED' ? '#fff2f0' : '#f6ffed',
                        borderLeft: `3px solid ${lophoc.TrangThai === 'CANCELLED' ? '#ff4d4f' : '#52c41a'}`,
                        borderRadius: 4,
                        fontSize: 13
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#262626' }}>{lophoc.TenLop}</div>
                      <div style={{ color: '#595959', margin: '4px 0' }}>
                        <ClockCircleOutlined /> {lophoc.GioHoc}
                      </div>
                      <Tag color="default" style={{ margin: 0 }}>{lophoc.PhongHoc ?? '-'}</Tag>
                    </div>
                  ))}
                </Space>
              )}
            </Card>
          );
        })}
      </div>

      {/* chú thích bên dưới */}
      <div style={{ marginTop: 24 }}>
        <Row justify="space-between" align="top">
          <Col>
            <Space size="large">
              <Text strong>Chú thích:</Text>
              <Space>
                <div style={{
                  width: 12, height: 12,
                  backgroundColor: '#52c41a', borderRadius: '50%'
                }}>
                </div> Buổi học bình thường
              </Space>

              <Space>
                <div style={{
                  width: 12, height: 12,
                  backgroundColor: '#ff4d4f', borderRadius: '50%'
                }}>
                </div> Buổi học đã hủy
              </Space>

              <Space>
                <div style={{
                  width: 12, height: 12,
                  backgroundColor: '#1890ff', borderRadius: '50%'
                }}>
                </div> Ngày hiện tại
              </Space>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Schedule;