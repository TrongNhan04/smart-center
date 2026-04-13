import {
  Card, Avatar, Descriptions, Tag, Typography, Space, Row, Col
} from 'antd';
import {
  UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, CalendarOutlined,
  SlackCircleFilled,
  ReadOutlined
} from '@ant-design/icons';
import type { TeacherDB } from './TeacherDTO';

const { Title, Text } = Typography;

const TabInfo = ({ teacher }: { teacher: TeacherDB }) => {

  // avatarUrl: `https://api.dicebear.com/8.x/notionists/svg?seed=ThanhNV`

  return (
    <Card
      variant='borderless'
      style={{
        background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 50%, #bae7ff 50%, #bae7ff 100%)',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        maxWidth: 460, // giới hạn chiều rộng để không bị giãn quá mức 
        margin: '20px auto', // căn giữa tabs
        minHeight: 260
      }}
    >
      <Row gutter={8} align="middle">
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
              <Tag color='orange' style={{ margin: 0, fontWeight: 600 }}>
                GIÁO VIÊN
              </Tag>
              <Text style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                Mã: {teacher.MaGiaoVien}
              </Text>
            </div>
          </Space>
        </Col>

        {/* cột phải thông tin chi tiết */}
        <Col xs={24} sm={24} md={18}>
          <div style={{ marginBottom: 16 }}>
            <Title level={3} style={{ margin: 0 }}>
              {teacher.HoTen}
            </Title>
          </div>

          <Descriptions
            column={1}
            size="middle"
            styles={{
              label:{ color: 'black', minWidth: 120 }, // Style cho nhãn
              content:{fontWeight:500}
            }}
          >
            <Descriptions.Item label={<Space><CalendarOutlined /> Ngày sinh</Space>}>
              <Text strong>{new Date(teacher.NgaySinh).toLocaleDateString()}</Text>
            </Descriptions.Item>

            <Descriptions.Item label={<Space><MailOutlined /> Email</Space>}>
              <Text strong>{teacher.Email}</Text>
            </Descriptions.Item>

            <Descriptions.Item label={<Space><PhoneOutlined /> Điện thoại</Space>}>
              <Text strong>{teacher.DienThoai}</Text>
            </Descriptions.Item>

            <Descriptions.Item label={<Space><ReadOutlined /> Chuyên môn</Space>}>
              <Text strong>{teacher.ChuyenMon}</Text>
            </Descriptions.Item>

            <Descriptions.Item label={<Space><EnvironmentOutlined /> Địa chỉ</Space>}>
              <Text strong>{teacher.DiaChi}</Text>
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>
    </Card>
  );
};

export default TabInfo;