import { Descriptions, Space, Typography, Progress, Tag } from 'antd';
import {
  UserOutlined, ClockCircleOutlined, CalendarFilled, EnvironmentFilled,
  ReadFilled,
  DollarCircleFilled
} from '@ant-design/icons';
import type { CourseDB } from './CourseDTO';

const { Text } = Typography;

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

  return (
    <div style={{ padding: '16px 0' }}>
      <Descriptions
        bordered
        size="middle" // tùy kích cỡ màn hình mà hiển thị mấy cột
        column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
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
          <Text style={{ fontSize:15}} >
            <DollarCircleFilled style={{color: '#52c41a'}}/> {Number(course.HocPhi).toLocaleString()}
          </Text>
        </Descriptions.Item>

        <Descriptions.Item label="Thời gian đào tạo">
          <Space><CalendarFilled style={{ color: '#1890ff' }} />
            {course.ThoiGian}tháng
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="Tổng số buổi học">
          <Space>
            <Text>{course.TongSoBuoi}</Text>
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="Lớp thuộc khóa">
          <ReadFilled  style={{color:'gray'}}/> {classes}
        </Descriptions.Item>

        <Descriptions.Item label="Tổng học viên">
          <UserOutlined/> {totalStu}
        </Descriptions.Item>

        {/* dùng span giống column để trường mô tả ăn hết chiều ngang */}
        <Descriptions.Item label="Mô tả chi tiết"
          span={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}>
          <div style={{ whiteSpace: 'pre-wrap', color: '#595959' }}>
            {course.MoTa ?? '-'}
          </div>
        </Descriptions.Item>

      </Descriptions>
    </div>
  );
};

export default TabInfo;