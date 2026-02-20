import { useState } from 'react';
import { Drawer, Descriptions, Table, Tag, Button } from 'antd';

interface Props {
  open: boolean,
  onCancel: () => void
}

const SessionDetail = ({ open, onCancel }: Props) => {
  // 1. State quản lý đóng/mở Drawer
  //   const [open, setOpen] = useState(false);

  // Giả lập dữ liệu học viên (Bạn sẽ thay bằng data gọi từ API)
  const studentData = [
    { id: 1, name: 'Nguyễn Văn A', status: 'PRESENT', note: 'Ngoan, hiểu bài' },
    { id: 2, name: 'Trần Thị B', status: 'ABSENT', note: 'Bệnh xin phép' },
  ];

  // Cột cho bảng điểm danh
  const columns = [
    { title: 'Mã HV', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Tên học viên', dataIndex: 'name', key: 'name' },
    {
      title: 'Điểm danh',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (status === 'PRESENT') return <Tag color="success">Có mặt</Tag>;
        if (status === 'ABSENT') return <Tag color="error">Vắng mặt</Tag>;
        return <Tag color="default">Chưa điểm danh</Tag>;
      },
    },
    { title: 'Nhận xét', dataIndex: 'note', key: 'note' },
  ];

  return (
    <>
      {/* Nút giả lập ngoài bảng lịch học để bấm mở Drawer */}
      {/* <Button type="primary" onClick={() => setOpen(true)}>
        Xem chi tiết buổi học
      </Button> */}

      {/* 2. KHUNG DRAWER CHÍNH */}
      <Drawer
        title="Chi tiết buổi học"
        size={800} // Cho độ rộng 800px để chứa bảng cho thoải mái
        placement="left" // Trượt từ phải sang
        onClose={() => onCancel()}
        maskClosable={false}
        open={open}
      >
        {/* PHẦN 1: THÔNG TIN CHUNG (Dùng Descriptions cho gọn gàng) */}
        <Descriptions title="Thông tin chung" bordered column={2} size="small" style={{ marginBottom: 24 }}>
          <Descriptions.Item label="Lớp học">IELTS 7.0 - Lớp Tối 246</Descriptions.Item>
          <Descriptions.Item label="Giáo viên">Nguyễn Văn C</Descriptions.Item>
          <Descriptions.Item label="Ngày học">20/02/2026</Descriptions.Item>
          <Descriptions.Item label="Ca học">18:00 - 19:30</Descriptions.Item>
          <Descriptions.Item label="Trạng thái" span={2}>
            <Tag color="success">Đã hoàn thành</Tag>
          </Descriptions.Item>
        </Descriptions>

        {/* PHẦN 2: KẾT QUẢ / ĐIỂM DANH */}
        <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 16 }}>
          Kết quả điểm danh ({studentData.length} học viên)
        </div>
        <Table
          dataSource={studentData}
          columns={columns}
          rowKey="id"
          pagination={false} // Thường 1 lớp < 30 người nên tắt phân trang cho gọn
          bordered
        />
      </Drawer>
    </>
  );
};

export default SessionDetail