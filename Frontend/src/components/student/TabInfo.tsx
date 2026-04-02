import {
  Card, Avatar, Descriptions, Tag, Button, Typography, Space, Divider,
  Row, Col, Badge
} from 'antd';
import {
  UserOutlined, MailOutlined, PhoneOutlined, EditOutlined, KeyOutlined,
  EnvironmentOutlined, CalendarOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const TabInfo = () => {
  // 1. MOCK DATA: Dữ liệu người dùng (Thường lấy từ useAuthStore hoặc API)
  const user = {
    hoTen: 'Nguyễn Văn Chí Thanh',
    maNV: 'ADMIN-001',
    email: 'thanh.nvcu@gmail.com',
    soDienThoai: '090.xxx.xxxx',
    chucVu: 'Quản trị viên cấp cao',
    role: 'ADMIN', // Dùng để check quyền
    trangThai: 'ACTIVE',
    phongBan: 'Phòng Đào tạo',
    ngayThamGia: '15/01/2024',
    diaChi: 'Long Xuyên, An Giang',
    // Avatar URL hoặc null
    avatarUrl: `https://api.dicebear.com/8.x/notionists/svg?seed=ThanhNV`
  };

  // Định nghĩa màu sắc cho Role Tag
  const roleMap: Record<string, { color: string, text: string }> = {
    ADMIN: { color: 'red', text: 'Quản trị' },
    TEACHER: { color: 'green', text: 'Giáo viên' },
  };
  const roleInfo = roleMap[user.role] || { color: 'default', text: user.role };

  return (
    <Card
      variant='borderless'
      style={{
        //background: 'linear-gradient(135deg, #fff 0%, #e6f7ff 50%, #fff 100%)',
        background: 'linear-gradient(135deg, #ffffff 0%, #bae7ff 50%, #ffffff 100%)',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)', // đổ bóng nhẹ cho sang
        border:'1px solid #f0f0f0',
        maxWidth: 600, // giới hạn chiều rộng để không bị giãn quá mức trên màn hình lớn
        margin: '20px auto' // Căn giữa màn hình
      }}
    >
      <Row gutter={32} align="middle">
        {/* cột trái là avatar */}
        <Col xs={24} sm={24} md={6}
          style={{ textAlign: 'center', borderRight: '1px solid #d9d9d9' }}>
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            
            <Badge status="success" offset={[-10, 110]} dot>
              <Avatar
                size={120}
                src={user.avatarUrl}
                icon={<UserOutlined />}
                style={{ border: '4px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              />
            </Badge>

            <div>
              <Tag color={roleInfo.color} style={{ margin: 0, fontWeight: 600 }}>
                {roleInfo.text.toLocaleUpperCase()}
              </Tag>
              <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                Mã: {user.maNV}
              </Text>
            </div>
          </Space>
        </Col>

        {/* cột phải thông tin chi tiết */}
        <Col xs={24} sm={24} md={18}>
          <div style={{ marginBottom: 16 }}>
            <Title level={2} style={{ margin: 0 }}>
              {user.hoTen}
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              {user.chucVu} 
            </Text>
          </div>

          <Descriptions
            column={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 1 }}
            size="middle"
            colon={false} // Bỏ dấu hai chấm cho thoáng
            labelStyle={{ color: '#888', minWidth: 100 }} // Style cho nhãn
            contentStyle={{ fontWeight: 500 }} // Style cho nội dung
          >
            <Descriptions.Item label={<Space><MailOutlined /> Email</Space>}>
              {user.email}
            </Descriptions.Item>

            <Descriptions.Item label={<Space><PhoneOutlined /> Điện thoại</Space>}>
              {user.soDienThoai}
            </Descriptions.Item>

            <Descriptions.Item label={<Space><EnvironmentOutlined /> Địa điểm</Space>}>
              {user.diaChi}
            </Descriptions.Item>

            <Descriptions.Item label={<Space><CalendarOutlined /> Gia nhập</Space>}>
              {user.ngayThamGia}
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>
    </Card>
  );
};

export default TabInfo;