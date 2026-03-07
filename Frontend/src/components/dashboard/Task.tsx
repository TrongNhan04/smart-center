
import { Alert, Space } from 'antd';
import { useNavigate } from 'react-router-dom'; // Dùng hook chuyển trang của React Router

const Task = () => {
  const navigate = useNavigate(); // Khởi tạo hàm chuyển trang

  return (
    <>
      {/* Dùng Space xếp dọc để các thông báo tự động cách nhau ra */}
      <Space direction="vertical" style={{ width: '100%' }}>
        
        {/* 1. MẪU THÔNG BÁO LỖI (Màu đỏ) */}
        <div 
          onClick={() => navigate('/admin/requests')} // Bấm vào là nhảy sang trang Duyệt
          style={{ cursor: 'pointer' }} // Biến con trỏ chuột thành hình bàn tay để user biết là bấm được
        >
          <Alert
            message="Yêu cầu mở khóa: Lớp tiếng anh b1"
            description="GV: Ngô Thị Tuyết - Lý do: Em quên lưu kết quả (Buổi 3)"
            type="error"
            showIcon
          />
        </div>

        {/* 2. MẪU THÔNG BÁO CẢNH BÁO (Màu cam) */}
        <div 
          onClick={() => navigate('/admin/classes/2')} // Nhảy sang chi tiết lớp ID = 2
          style={{ cursor: 'pointer' }}
        >
          <Alert
            message="Bổ sung lịch học: Lớp tiếng anh b1"
            description="Lịch học của lớp gần hết. Đã tạo 3/32 buổi học."
            type="warning"
            showIcon
          />
        </div>

        {/* 3. MẪU THÔNG BÁO NHẮC NHỞ (Màu xanh dương) */}
        <div 
          onClick={() => navigate('/admin/attendance')} 
          style={{ cursor: 'pointer' }}
        >
          <Alert
            message="Chưa nộp điểm danh: Lớp tiếng anh b1"
            description="GV: Ngô Thị Tuyết chưa nộp kết quả ngày 12/01/2026."
            type="info"
            showIcon
          />
        </div>

      </Space>
    </>
  );
};

export default Task;