import { Descriptions, Space, Typography, Tag, List, Row, Col } from 'antd';
import {
  UserOutlined, CalendarFilled, DollarCircleFilled, ReadOutlined,
  BookOutlined,
  BookFilled,
  DollarCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import type { CourseDB } from './CourseDTO';

const { Text, Title } = Typography;

interface Props {
  course: CourseDB
  classes: number
  totalStu: number
}

const TabInfo = ({ course, classes, totalStu }: Props) => {

  const levelColor: Record<string, { color: string, text: string }> = {
    BEGINER: { color: 'green', text: 'SƠ CẤP' },
    INTERMEDIATE: { color: 'geekblue', text: 'TRUNG CẤP' },
    ADVANCED: { color: 'orange', text: 'NÂNG CAO' }
  }
  const level = course ? levelColor[course.TrinhDo] : { color: 'default', text: '' }
console.log(course.decuong)
  return (
    <div style={{ padding: '16px 0' }}>
      <Row gutter={16}>
        <Col span={12}>
          <Descriptions
            size="middle" // tùy kích cỡ màn hình mà hiển thị mấy cột
            column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
            styles={{
              label: { color: 'gray' },
              //content: { minWidth: 180 }
            }}
          >
            <Descriptions.Item label="Mã khóa học">
              <Text strong>{course.MaKhoaHoc}</Text>
            </Descriptions.Item>

            <Descriptions.Item label="Tên khóa học">
              <Text strong style={{ color: '#1890ff' }}>{course.TenKhoaHoc}</Text>
            </Descriptions.Item>

            <Descriptions.Item label="Trình độ">
              <Space>
                <Tag color={level.color}>{level.text}</Tag>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Học phí">
              <Text style={{ fontSize: 15 }} >
                <DollarCircleOutlined style={{ color: '#52c41a' }} /> {Number(course.HocPhi).toLocaleString()}đ
              </Text>
            </Descriptions.Item>

            <Descriptions.Item label="Thời gian đào tạo">
              <Space><CalendarOutlined style={{ color: '#1677ff' }} />
                {course.ThoiGian}tháng
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Tổng số buổi học">
              <Space>
                <Text>{course.TongSoBuoi}</Text>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Số lớp học">
              <Space><ReadOutlined style={{ color: '#722ed1' }} />{classes}lớp</Space>
            </Descriptions.Item>

            <Descriptions.Item label="Tổng học viên">
              <Space><UserOutlined style={{color:'#8c8c8c'}}/>{totalStu}</Space>
            </Descriptions.Item>

            {/* dùng span giống column để trường mô tả ăn hết chiều ngang */}
            <Descriptions.Item label="Mô tả chi tiết"
              span={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}>
              <div style={{ whiteSpace: 'pre-wrap', color: '#595959' }}>
                {course.MoTa ?? 'Chưa cập nhật'}
              </div>
            </Descriptions.Item>
          </Descriptions>
        </Col>

        <Col span={12}>
          <Title level={5} style={{ marginBottom: 16 }}>
            <BookOutlined style={{ marginRight: 8, color:'#1677ff' }} />
            Đề cương khóa học ({course.decuong.length} buổi)
          </Title>

          {/* Khung giới hạn chiều cao + thanh cuộn */}
          <div style={{
            maxHeight: 374, // Khóa cứng chiều cao
            overflowY: 'auto', // Tự sinh thanh cuộn nếu dài hơn 350px
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            padding: '0 16px',
            backgroundColor: '#fafafa'
          }}>
            <List
              itemLayout="horizontal"
              dataSource={course.decuong}
              renderItem={(item) => (
                <List.Item style={{ padding: '12px 0' }}>
                  <List.Item.Meta
                    avatar={
                      <Tag color="blue"
                        style={{
                          minWidth: 65, textAlign: 'center',
                          marginTop: 2
                        }}>
                        Buổi {item.ThuTu}
                      </Tag>
                    }
                    title={
                      <Text style={{ fontWeight: 500, color: '#262626' }}>
                        {item.ChuDe}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default TabInfo;