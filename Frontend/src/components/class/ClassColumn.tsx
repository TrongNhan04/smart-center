import { Badge, Progress, Space, Typography } from "antd"
import type { ClassDB } from "./ClassInterface"
import { CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons"

const { Text } = Typography

const ClassColumn = (isHiden: boolean) => {
  const columns = [
    {// mã lớp+tên lớp chung
      title: 'Lớp học', dataIndex: 'MaLopHoc', key: 'MaLopHoc',
      render: (code: string, lophoc: ClassDB) => (
        <Space orientation="vertical">
          <Text strong style={{ color: '#1890ff' }}>
            {lophoc.TenLop}</Text>
          <Text type="secondary" style={{ fontSize: 14 }}>{code}</Text>
        </Space>
      )
    },
    ...(!isHiden ? [ // toán tử spread lấy phần ruột
      { // nếu đúng lấy {}, sai trả về mảng rỗng -> ruột rỗng
        title: 'Khóa học', dataIndex: ['KhoaHoc', 'TenKhoaHoc'],
        key: 'TenKhoaHoc', ellipsis: true
      },
    ] : []),
    {
      title: 'Giáo viên', dataIndex: ['GiaoVien', 'HoTen'],
      key: 'HoTen', ellipsis: true
    },
    {
      title: 'Khai giảng', dataIndex: 'TuNgay', key: 'TuNgay',
      render: (day: string) =>
        <Text><CalendarOutlined /> {new Date(day).toLocaleDateString()}</Text>
    },
    {
      title: 'Lịch học', dataIndex: 'LichHoc', key: 'LichHoc',
      render: (schedule: number[], lophoc: ClassDB) => {
        const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
        const result = schedule.map(m => dow[m]).join('-')

        {/* orientation="vertical" giúp xếp chồng lên nhau */ }
        return <Space orientation="vertical" size={0}>
          <Text strong><ClockCircleOutlined /> {lophoc.GioHoc}</Text>

          <Text type="secondary" style={{ fontSize: '14px', display: 'block', textAlign: 'center' }}>
            {result}
          </Text>
        </Space>
      }
    },
    {
      title: 'Sĩ số', dataIndex: 'SiSo', key: 'SiSo',
      render: (classSize: number, lophoc: ClassDB) => (
        // <Space orientation="vertical" size={0}>
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{lophoc.TongGhiDanh}/{classSize}</span>
            <small style={{ color: '#999' }}>HV</small>
          </div>
          <Progress
            percent={(lophoc.TongGhiDanh / classSize) * 100}
            showInfo={false}
          />
        </>// </Space>
      )
    },
    {
      title: 'Trạng thái', dataIndex: 'TrangThai', key: 'TrangThai',
      render: (value: string) => {
        const statusMap: Record<string, { color: string, text: string }> = {
          OPEN: { color: 'default', text: 'Tuyển sinh' },
          RUNNING: { color: 'success', text: 'Đang hoạt động' },
          CLOSED: { color: 'error', text: 'Đã đóng' }
        }
        // value là 1 trong 3 key đó
        const status = statusMap[value]
        return <Badge status={status.color as any} text={status.text} />
      }
    },
    ...(!isHiden ? [
      {
        title: 'Thao tác', key: 'action', align: 'center' as const
      }
    ] : [])
  ]
  return columns
}

export default ClassColumn