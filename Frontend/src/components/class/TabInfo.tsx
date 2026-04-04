import { Descriptions, Space, Typography, Progress } from 'antd';
import {
  UserOutlined, CalendarFilled, EnvironmentFilled, ClockCircleFilled, BookFilled
} from '@ant-design/icons';
import type { ClassDB } from './ClassDTO';

const { Text } = Typography;

interface Props {
  lophoc: ClassDB
}

const TabInfo = ({ lophoc }: Props) => {

  const weeks = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  const dow = lophoc.LichHoc.map(item => weeks[item]).join(', ')

  const tuNgay = new Date(lophoc.TuNgay).toLocaleDateString()
  const denNgay = new Date(lophoc.DenNgay).toLocaleDateString()
  return (
    <div style={{ padding: '16px 0' }}>
      <Descriptions
        // bordered
        size="middle" // tùy kích cỡ màn hình mà hiển thị mấy cột
        column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
        styles={{
          label: { color: 'black' }
        }}
      >
        <Descriptions.Item label="Mã lớp">
          <Text strong>{lophoc.MaLopHoc}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="Lớp">
          <Text strong style={{ color: '#1890ff' }}>{lophoc.TenLop}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="Khóa học">
          <Space><BookFilled style={{ color: 'purple' }} />
            {lophoc.KhoaHoc.TenKhoaHoc}</Space>
        </Descriptions.Item>

        <Descriptions.Item label="Giáo viên">
          <Space><UserOutlined style={{ color: '#8c8c8c' }} />
            {lophoc.GiaoVien.HoTen}</Space>
        </Descriptions.Item>

        <Descriptions.Item label="Phòng học">
          <Space><EnvironmentFilled style={{ color: '#ff4d4f' }} />
            {lophoc.PhongHoc ?? 'Chưa cập nhật'}</Space>
        </Descriptions.Item>

        <Descriptions.Item label="Sĩ số">
          <Space>
            <Text>{lophoc.TongGhiDanh} / {lophoc.SiSo} HV</Text>
            <Progress
              percent={Math.round((lophoc.TongGhiDanh / lophoc.SiSo) * 100)}
              steps={5} // mỗi ô là 5 đơn vị
              showInfo={false}
              strokeColor="#52c41a" // màu thanh tiến độ
            />
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="Thời gian">
          <Space><CalendarFilled style={{ color: '#1890ff' }} />
            {tuNgay} - {denNgay}</Space>
        </Descriptions.Item>

        <Descriptions.Item label="Lịch học">
          <Space>
            <Text ><ClockCircleFilled /> {dow} {lophoc.GioHoc}</Text>
          </Space>
        </Descriptions.Item>

        {/* dùng span giống column để trường mô tả ăn hết chiều ngang */}
        <Descriptions.Item label="Mô tả chi tiết"
          span={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}>
          <Text>{lophoc.MoTa ?? 'Chưa cập nhật'}</Text>
        </Descriptions.Item>

      </Descriptions>
    </div>
  );
};

export default TabInfo;