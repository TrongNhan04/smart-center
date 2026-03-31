import { Drawer, Descriptions, Table, Tag, message, Popover } from 'antd';
import { sessionApi } from '../../api/sessionApi';
import { useEffect, useState } from 'react';
import type {SessionResult, TSessionDetail } from './SessionDTO';
import { DateHelper } from '../common/date.helper';
import { PhoneOutlined, UserOutlined } from '@ant-design/icons';

interface Props {
  open: boolean,
  onCancel: () => void
  sessionId: number
}

const SessionDrawer = ({ open, onCancel, sessionId }: Props) => {
  const [sessionDetail, setSessionDetail] = useState<TSessionDetail | null>(null)

  const fetchSessionDetail = async () => {
    try {
      const res = await sessionApi.getDetailsById(sessionId)
      setSessionDetail(res.data)
    } catch (error: any) {
      console.log("Có lỗi xảy ra: ", error)

      if (error.response) {
        const serverError = error.response.data
        // nếu là mảng lỗi thì lấy cái đầu tiên
        if (Array.isArray(serverError.message))
          message.error(serverError.message[0])
        else if (typeof serverError.message === 'string')
          message.error(serverError.message)
        else
          message.error("Có lỗi xảy ra")
      }
    }
  }

  const statusColor: Record<string, { color: string, text: string }> = {
    SCHEDULED: { color: 'default', text: 'Sắp tới' },
    COMPLETED: { color: 'green', text: 'Hoàn thành' },
    CANCELLED: { color: 'error', text: 'Đã hủy' },
  } // status cho tiêu đề
  const status = sessionDetail ? statusColor[sessionDetail!.TrangThai]
    : { color: 'default', text: '' }

  useEffect(() => {
    if (open) {
      if (sessionId)
        fetchSessionDetail()
    }
  }, [open, sessionId])
  // Cột cho bảng điểm danh
  const columns = [
    { title: 'Mã HV', dataIndex: 'MaHocVien', key: 'MaHocVien', width: 80 },
    {
      title: 'Tên học viên', dataIndex: 'TenHocVien', key: 'TenHocVien',
      render: (value: string, result: SessionResult) =>
        <Popover
          content={(
            <div>
              <p><UserOutlined/> Phụ huynh: {result.PhuHuynh}</p>
              <p><PhoneOutlined/> Điện thoại: {result.DienThoai}</p>
            </div>
          )}
          title="Thông tin liên lạc">
          {value}
        </Popover>
    },
    {
      title: 'Điểm danh',
      dataIndex: 'DiemDanh',
      key: 'DiemDanh',
      render: (attend: boolean) => {
        if (attend) return <Tag color="green">Có mặt</Tag>
        else if (attend == false) return <Tag color="error">Vắng mặt</Tag>
        else <Tag color="default">Chưa điểm danh</Tag>
      },
    },
    { title: 'Nhận xét', dataIndex: 'NhanXet', key: 'NhanXet' },
    {
      title: 'Điểm', dataIndex: 'Diem', key: 'Diem', align:'center' as const,
      render: (value: number) => value ?? '-'
    }
  ];

  return (
    <>
      {/* 2. KHUNG DRAWER CHÍNH */}
      <Drawer
        title="Chi tiết buổi học"
        size={700}
        placement="right"
        onClose={() => onCancel()}
        open={open}
      >
        {/* Thông tin chung */}
        <Descriptions title="Thông tin chung" bordered column={2} size="small" style={{ marginBottom: 24 }}>
          <Descriptions.Item label="Lớp học">{sessionDetail?.LopHoc}</Descriptions.Item>
          <Descriptions.Item label="Giáo viên">{sessionDetail?.GiaoVien}</Descriptions.Item>
          <Descriptions.Item label="Ngày học">
            {new Date(sessionDetail?.BatDauLuc!).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Ca học">
            {DateHelper.ISOToHHMM(sessionDetail?.BatDauLuc!,
              sessionDetail?.KetThucLuc!)}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái" span={2}>
            <Tag color={status.color}>{status.text}</Tag>
          </Descriptions.Item>
        </Descriptions>

        {/* Kết quả buổi học */}
        <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 16 }}>
          Kết quả buổi học
        </div>
        <Table
          dataSource={sessionDetail?.ChiTietKetQua?.filter(Boolean) || []}
          columns={columns}
          rowKey="HocVienID"
          pagination={false}
          bordered
        />
      </Drawer>
    </>
  );
};

export default SessionDrawer