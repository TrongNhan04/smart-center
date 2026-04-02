// import { SafetyOutlined, UserOutlined } from "@ant-design/icons"
// import {
//   Avatar, Button, Card, Col, Form, Input, message, notification,
//   Row, Select, Typography
// } from "antd"
// import { useAuthStore } from "../../store/useAuthStore"
// import { useState } from "react"
// import { getChangedValue } from "../common/utils"
// import { authApi } from "../../api/authApi"
// import ChangePw from "./ChangePw"

// const { Title, Text } = Typography

// const Profile = () => {
//   const [form] = Form.useForm()
//   const [loading, setLoading] = useState(false)
//   const [isOpen, setIsOpen] = useState(false)
//   const user = useAuthStore(state => state.user)
//   const update = useAuthStore(state => state.update)
//   const logout = useAuthStore(state => state.logout)

//   const role = user?.role === 'TEACHER' ? 'Giáo viên' : 'Admin'
//   const handleUpdate = async () => {
//     setLoading(true)
//     try {
//       const values = await form.validateFields()

//       const updateData = getChangedValue(user, values)
//       if (Object.keys(updateData).length === 0) {
//         message.info('Không có thông tin nào thay đổi')
//         return
//       }

//       const res = await authApi.update(updateData)
//       form.resetFields()
//       form.setFieldsValue(res.data)
//       update(res.data)
//       message.success('Thao tác thành công')
//       if (Object.keys(updateData).includes('email'))
//         logout()

//     } catch (error: any) {
//       notification.error({
//         title: 'Có lỗi xảy ra',
//         description: error?.response?.data?.message,
//         showProgress: true,
//         pauseOnHover: true
//       })
//       console.log('Có lỗi xảy ra: ', error?.response?.data?.message)
//     }
//     finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div style={{ padding: 24, background: '#f0f2f5', minHeight: '91vh' }}>
//       <Title level={3} style={{ marginTop: 0, marginBottom: 24 }}>Thông tin tài khoản</Title>

//       <Row gutter={[24, 24]}>
        
//         <Col xs={24} md={8} lg={6}>
//           <Card
//             variant='borderless'
//             style={{
//               borderRadius: 8, textAlign: 'center'
//             }}
//           >
//             <Avatar
//               size={140}
//               icon={<UserOutlined />}
//               style={{ marginBottom: 16, border: '2px solid #f0f0f0' }}
//             />
//             <Title level={4} style={{ margin: 0 }}>{user?.full_name}</Title>
//             <Text type="secondary">{role}</Text>

//             {/* <Divider />

//             <Space orientation="vertical" style={{ width: '100%', textAlign: 'left' }}>
//               <Text type="secondary"><MailFilled /> {user?.email}</Text>
//               <Text type="secondary"><PhoneFilled /> {user?.phone}</Text>
//             </Space>

//             <Divider  /> */}
//           </Card>
//         </Col>

//         {/* form chỉnh sửa thông tin */}
//         <Col xs={24} md={16} lg={18}>
//           <Card
//             title="Cập nhật thông tin cá nhân"
//             variant='borderless'
//             styles={{
//               header: { backgroundColor: '#e6f4ff', color: '#0958d9' }
//             }}
//             extra={
//               <Button type="text" danger icon={<SafetyOutlined />}
//                 onClick={() => setIsOpen(true)}
//               >Đổi mật khẩu</Button>
//             }
//           >
//             <Form
//               form={form}
//               layout="vertical"
//               initialValues={user!} // Đổ dữ liệu cũ vào form
//             >
//               <Row gutter={16}>
//                 <Col xs={24} sm={12}>
//                   <Form.Item // họ tên
//                     label="Họ và tên"
//                     name="full_name"
//                     rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
//                   >
//                     <Input placeholder="Nhập họ và tên" />
//                   </Form.Item>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Form.Item // chức vụ
//                     label="Chức vụ" name='role'>
//                     <Select options={[
//                       { label: `${user?.role}`, value: `${user?.role}` }
//                     ]} />
//                   </Form.Item>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Form.Item // email
//                     label="Email liên hệ"
//                     name="email"
//                     rules={[
//                       { required: true, message: 'Vui lòng nhập email!' },
//                       { type: 'email', message: 'Email không hợp lệ!' }
//                     ]}
//                   >
//                     <Input placeholder="Nhập địa chỉ email" />
//                   </Form.Item>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Form.Item //điện thoại 
//                     label="Số điện thoại"
//                     name="phone"
//                   >
//                     <Input placeholder="Nhập số điện thoại" />
//                   </Form.Item>
//                 </Col>

//                 {/* <Col span={24}>
//                   <Form.Item // địa chỉ
//                     label="Địa chỉ hiện tại" name="address">
//                     <Input.TextArea rows={3} placeholder="Nhập địa chỉ của bạn" />
//                   </Form.Item>
//                 </Col> */}
//               </Row>

//               <Form.Item // nút lưu cập nhật
//                 style={{ marginBottom: 0, textAlign: 'right' }}>
//                 <Button type="primary" loading={loading}
//                   onClick={handleUpdate}>
//                   Lưu thay đổi
//                 </Button>
//               </Form.Item>
//             </Form>
//           </Card>
//         </Col>
//       </Row>

//       <ChangePw
//         open={isOpen}
//         onCancel={() => { setIsOpen(false) }}
//       />
//     </div>
//   )
// }

// export default Profile


import React from 'react';
import { Card, Avatar, Typography, Row, Col, Divider, Space, Tag } from 'antd';
import { UserOutlined, QrcodeOutlined, SecurityScanOutlined } from '@ant-design/icons';
// Thư viện xử lý ngày tháng (AntD v5 mặc định dùng)
import dayjs from 'dayjs'; 

const { Text, Title } = Typography;

const IdentityCard = () => {
  // 1. MOCK DATA: Thông tin người dùng (Thực tế lấy từ API)
  const userData = {
    idNumber: '030095001234', // Số định danh
    fullName: 'NGUYỄN VĂN ĐOÀN',
    birthDate: '1995-05-15',
    gender: 'Nam',
    nationality: 'Việt Nam',
    placeOfOrigin: 'TP. Long Xuyên, An Giang',
    placeOfResidence: 'P. Mỹ Xuyên, TP. Long Xuyên, An Giang',
    expiryDate: '2035-05-15',
    avatarUrl: 'https://api.dicebear.com/8.x/notionists/svg?seed=Doan', // Ảnh giả lập
    role: 'GIÁO VIÊN', // Thêm vai trò để phân loại thẻ
    joinDate: '2020-01-01',
  };

  // Định nghĩa màu sắc cho vai trò
  const roleColors: Record<string, string> = {
    'ADMIN': '#f5222d', // Đỏ
    'GIÁO VIÊN': '#1677ff', // Xanh dương
    'NHÂN VIÊN': '#52c41a', // Xanh lá
  };

  return (
    <div style={{ padding: 50, display: 'flex', justifyContent: 'center', background: '#f0f2f5', minHeight: '100vh' }}>
      
      {/* 2. KHUNG THẺ CHÍNH (Card) */}
      <Card
        hoverable
        style={{
          width: 650, // Chiều rộng chuẩn thẻ ngang
          height: 400, // Chiều cao chuẩn
          borderRadius: 16,
          // CSS tạo màu nền vân sọc mờ giống thẻ thật mà không cần file ảnh
          background: 'linear-gradient(135deg, #fff 0%, #e6f7ff 50%, #fff 100%)',
          border: '2px solid #d9d9d9',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden',
          padding: 0
        }}
        bodyStyle={{ padding: 0 }} // Bỏ padding mặc định của Card body
      >
        {/* ĐƯỜNG BO VIỀN MÀU ĐỎ/VÀNG TRÊN CÙNG (Giống thẻ CCCD) */}
        <div style={{ height: 8, background: 'linear-gradient(90deg, #ff4d4f 0%, #ffc53d 50%, #ff4d4f 100%)' }} />

        {/* 3. PHẦN HEADER CỦA THẺ */}
        <div style={{ padding: '16px 24px 0 24px', textAlign: 'center' }}>
          <Row justify="space-between" align="middle">
            <Col>
              {/* Giả lập Quốc huy/Logo trung tâm */}
              <Avatar size={40} icon={<SecurityScanOutlined />} style={{ background: '#fadb14', color: '#873800' }} />
            </Col>
            <Col span={18}>
              <Title level={5} style={{ margin: 0, color: '#003a8c', letterSpacing: 1 }}>
                HỆ THỐNG QUẢN LÝ TRUNG TÂM
              </Title>
              <Text strong style={{ color: '#d4380d', fontSize: 16, letterSpacing: 2 }}>
                THẺ ĐỊNH DANH NHÂN SỰ
              </Text>
            </Col>
            <Col>
              {/* Tag hiển thị vai trò */}
              <Tag color={roleColors[userData.role]} style={{ margin: 0, fontWeight: 'bold' }}>
                {userData.role}
              </Tag>
            </Col>
          </Row>
          <Divider style={{ margin: '12px 0', borderColor: '#bfbfbf' }} />
        </div>

        {/* 4. PHẦN THÂN THẺ (Nội dung chính) */}
        <div style={{ padding: '0 24px' }}>
          <Row gutter={24}>
            {/* Cột trái: Ảnh và Mã số */}
            <Col span={8} style={{ textAlign: 'center' }}>
              <Avatar
                shape="square"
                size={160}
                src={userData.avatarUrl}
                icon={<UserOutlined />}
                style={{
                  border: '4px solid #fff',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                  marginBottom: 16
                }}
              />
              {/* Chip giả lập */}
              <div style={{
                width: 50, height: 40, background: '#ffe58f',
                border: '2px solid #b78100', borderRadius: 8, margin: '0 auto 16px auto',
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: '#b78100', transform: 'translateY(-50%)' }} />
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: '#b78100', transform: 'translateX(-50%)' }} />
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>Số / No.:</Text>
              <br />
              <Text strong style={{ fontSize: 18, letterSpacing: 1 }}>{userData.idNumber}</Text>
            </Col>

            {/* Cột phải: Chi tiết thông tin */}
            <Col span={16}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Họ và tên / Full name:</Text>
                  <br />
                  {/* Tên luôn viết hoa đậm */}
                  <Text strong style={{ fontSize: 22, color: '#000' }}>{userData.fullName.toLocaleUpperCase()}</Text>
                </div>

                <Row gutter={16}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Ngày sinh / Date of birth:</Text>
                    <br />
                    <Text strong>{dayjs(userData.birthDate).format('DD/MM/YYYY')}</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Giới tính / Sex:</Text>
                    <br />
                    <Text strong>{userData.gender}</Text>
                  </Col>
                </Row>

                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Quê quán / Place of origin:</Text>
                  <br />
                  <Text strong ellipsis>{userData.placeOfOrigin}</Text>
                </div>

                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Nơi thường trú / Place of residence:</Text>
                  <br />
                  <Text strong ellipsis>{userData.placeOfResidence}</Text>
                </div>
              </Space>
            </Col>
          </Row>
        </div>

        {/* 5. PHẦN FOOTER CỦA THẺ (Mã QR và Hạn dùng) */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 24px', background: 'rgba(255,255,255,0.6)',
          borderTop: '1px solid #e8e8e8',
          display: 'flex', justifyContent: 'space-between', 
        }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Có giá trị đến / Date of expiry: &nbsp;
            <Text strong style={{ color: '#000' }}>{dayjs(userData.expiryDate).format('DD/MM/YYYY')}</Text>
          </Text>
          
          {/* Mã QR giả lập (Rất quan trọng cho thẻ ID) */}
          <Space>
             <Text type="secondary" style={{ fontSize: 11 }}>Scan to verify</Text>
             <QrcodeOutlined style={{ fontSize: 32, color: '#595959' }} />
          </Space>
        </div>

      </Card>
    </div>
  );
};

export default IdentityCard;