import React from 'react';
import { Modal, Form, Input, InputNumber, Select, Row, Col } from 'antd';

// Định nghĩa Props chỉ để nhận lệnh Đóng/Mở từ cha
interface AddCourseModalProps {
  open: boolean;
  onCancel: () => void;
}

const AddCourseModal: React.FC<AddCourseModalProps> = ({ open, onCancel }) => {
  return (
    <Modal
      title="Thêm khóa học mới"
      open={open}
      onCancel={onCancel}
      width={700} // Rộng hơn xíu cho thoáng
      okText="Lưu lại"
      cancelText="Hủy bỏ"
      centered // Căn giữa màn hình cho đẹp
    >
      <Form layout="vertical">
        {/* --- DÒNG 1: TÊN KHÓA HỌC (Full chiều ngang) --- */}
        <Form.Item 
          label="Tên khóa học" 
          name="TenKhoaHoc" 
          required // Hiện dấu sao đỏ thẩm mỹ
        >
          <Input placeholder="Ví dụ: Lập trình ReactJS căn bản..." />
        </Form.Item>

        {/* --- DÒNG 2: TRÌNH ĐỘ (Trái) - HỌC PHÍ (Phải) --- */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              label="Trình độ" 
              name="TrinhDo" 
              required
            >
              <Select placeholder="Chọn trình độ">
                <Select.Option value="BEGINNER">Cơ bản (Beginner)</Select.Option>
                <Select.Option value="INTERMEDIATE">Trung cấp (Intermediate)</Select.Option>
                <Select.Option value="ADVANCED">Nâng cao (Advanced)</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item 
              label="Học phí (VNĐ)" 
              name="HocPhi" 
              required
            >
              {/* InputNumber có format dấu phẩy nhìn cho chuyên nghiệp */}
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Nhập số tiền..."
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
                addonAfter="₫" // Ký hiệu tiền tệ ở đuôi
              />
            </Form.Item>
          </Col>
        </Row>

        {/* --- DÒNG 3: THỜI GIAN (Trái) - SỐ BUỔI (Phải) --- */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              label="Thời gian đào tạo" 
              name="ThoiGian" 
              required
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={1} 
                addonAfter="Tháng" // Hậu tố đơn vị
                placeholder="VD: 3"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item 
              label="Số buổi học / Tuần" 
              name="SoBuoi1Tuan" 
              required
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={1} 
                max={7} 
                addonAfter="Buổi"
                placeholder="VD: 3"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* --- DÒNG 4: MÔ TẢ (Full chiều ngang) --- */}
        <Form.Item label="Mô tả chi tiết" name="MoTa">
          <Input.TextArea 
            rows={4} 
            placeholder="Nhập nội dung chi tiết khóa học, lộ trình, yêu cầu đầu vào..." 
            showCount 
            maxLength={500} 
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddCourseModal;