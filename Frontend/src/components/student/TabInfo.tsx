import {
  Card, Avatar, Descriptions, Tag, Typography, Space, Row, Col, Badge
} from 'antd';
import {
  UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, CalendarOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import type { StudentDB } from './StudentDTO';

const { Title, Text } = Typography;

const TabInfo = ({ student }: { student: StudentDB }) => {

  // avatarUrl: `https://api.dicebear.com/8.x/notionists/svg?seed=ThanhNV`

  // Định nghĩa màu sắc cho Role Tag


  return (
    <Card
      variant='borderless'
      style={{
        background: 'linear-gradient(135deg, #fff 0%, #e6f7ff 50%, #fff 100%)',
        //background: 'linear-gradient(135deg, #fff 0%, #bae7ff 50%, #ffffff 100%)',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        maxWidth: 500, // giới hạn chiều rộng để không bị giãn quá mức 
        margin: '20px auto' // căn giữa tabs
      }}
    >
      <Row gutter={32} align="middle">
        {/* cột trái là avatar */}
        <Col xs={24} sm={24} md={6}
          style={{ textAlign: 'center', borderRight: '1px solid #d9d9d9' }}>
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                                          {/* x, y */}
            <Badge status="success" offset={[-10, 90]} dot>
              <Avatar // Badge bên ngoài để có chấm xanh 
                size={95}
                //src={user.avatarUrl}
                icon={<UserOutlined />}
                style={{
                  border: '4px solid #fff', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              />
            </Badge>

            <div>
              <Tag color='blue' style={{ margin: 0, fontWeight: 600 }}>
                HỌC VIÊN
              </Tag>
              <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                Mã: {student.MaHocVien}
              </Text>
            </div>
          </Space>
        </Col>

        {/* cột phải thông tin chi tiết */}
        <Col xs={24} sm={24} md={18}>
          <div style={{ marginBottom: 16 }}>
            <Title level={3} style={{ margin: 0 }}>
              {student.TenHocVien}
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Học viên
            </Text>
          </div>

          <Descriptions
            column={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 1 }}
            size="middle"
            // colon={false} // Bỏ dấu hai chấm cho thoáng
            labelStyle={{ color: '#888', minWidth: 100 }} // Style cho nhãn
            contentStyle={{ fontWeight: 500 }} // Style cho nội dung
          >
            <Descriptions.Item label={<Space><CalendarOutlined /> Ngày sinh</Space>}>
              {new Date(student.NgaySinh).toLocaleDateString()}
            </Descriptions.Item>

            <Descriptions.Item label={<Space><MailOutlined /> Email</Space>}>
              {student.Email}
            </Descriptions.Item>

            <Descriptions.Item label={<Space><PhoneOutlined /> Điện thoại</Space>}>
              {student.DienThoai}
            </Descriptions.Item>

            <Descriptions.Item label={<Space><EnvironmentOutlined /> Địa chỉ</Space>}>
              {student.DiaChi}
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>
    </Card>
  );
};

export default TabInfo;