import {
  Card, Avatar, Descriptions, Tag, Typography, Space, Row, Col
} from 'antd';
import {
  UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, CalendarOutlined,
  SlackCircleFilled
} from '@ant-design/icons';
import type { StudentDB } from './StudentDTO';

const { Title, Text } = Typography;

const TabInfo = ({ student }: { student: StudentDB }) => {

  // avatarUrl: `https://api.dicebear.com/8.x/notionists/svg?seed=ThanhNV`

  // Định nghĩa màu sắc cho Role Tag
  return (
    <Card
      variant='borderless'
      style={{
        background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 50%, #bae7ff 50%, #bae7ff 100%)',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        maxWidth: 450, // giới hạn chiều rộng để không bị giãn quá mức 
        margin: '20px auto', // căn giữa tabs
        minHeight: 260
      }}
    >
      <Row gutter={16} align="middle">
        {/* cột trái là avatar */}
        <Col xs={24} sm={24} md={6}
          style={{ textAlign: 'center', }}>
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <SlackCircleFilled style={{ fontSize: 30 }} />
            
            <Avatar 
              size={90}
              shape='square'
              //src={user.avatarUrl}
              icon={<UserOutlined style={{ color: 'gray' }} />}
              style={{
                backgroundColor: 'white',
                border: '1px solid',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            {/* </Badge> */}

            <div>
              <Tag color='blue' style={{ margin: 0, fontWeight: 600 }}>
                HỌC VIÊN
              </Tag>
              <Text style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
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
          </div>

          <Descriptions
            column={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 1 }}
            size="middle"
            labelStyle={{ color: 'black', minWidth: 110 }} // Style cho nhãn
            contentStyle={{ fontWeight: 500 }} // Style cho nội dung
          >
            <Descriptions.Item label={<Space><CalendarOutlined /> Ngày sinh</Space>}>
              <Text strong>{new Date(student.NgaySinh).toLocaleDateString()}</Text>
            </Descriptions.Item>

            <Descriptions.Item label={<Space><UserOutlined/>Phụ huynh</Space>}>
              <Text strong>{student.PhuHuynh}</Text>
            </Descriptions.Item>

            <Descriptions.Item label={<Space><MailOutlined /> Email</Space>}>
              <Text strong>{student.Email}</Text>
            </Descriptions.Item>

            <Descriptions.Item label={<Space><PhoneOutlined /> Điện thoại</Space>}>
              <Text strong>{student.DienThoai}</Text>
            </Descriptions.Item>

            <Descriptions.Item label={<Space><EnvironmentOutlined /> Địa chỉ</Space>}>
              <Text strong>{student.DiaChi}</Text>
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>
    </Card>
  );
};

export default TabInfo;