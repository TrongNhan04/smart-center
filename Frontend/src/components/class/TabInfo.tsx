import { Descriptions, Space, Typography, Progress } from 'antd';
import {
  UserOutlined, BookOutlined, EnvironmentOutlined, CalendarOutlined,
  ClockCircleOutlined, DollarCircleOutlined
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


  const percent = (lophoc.TongGhiDanh / lophoc.SiSo) * 100
  let percentColor =
    percent > 70 ? '#52c41a' :
    percent > 50 ? '#faad14' :
      '#ff4d4f' // đỏ

  return (
    <div style={{ padding: '16px 0' }}>
      <Descriptions
        size="middle"
        // tùy kích cỡ màn hình mà hiển thị mấy cột
        column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
      >
        <Descriptions.Item label="Lớp">
          <Text>{lophoc.MaLopHoc} - {lophoc.TenLop}</Text>
        </Descriptions.Item>


        <Descriptions.Item label="Khóa học">
          <Space><BookOutlined style={{ color: '#722ed1' }} />
            {lophoc.TenKhoaHoc}
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="Giáo viên">
          <Space><UserOutlined style={{ color: '#8c8c8c' }} />
            {lophoc.GiaoVien}
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="Sĩ số">
          <Space>
            <Text>{lophoc.TongGhiDanh} / {lophoc.SiSo} HV</Text>

            <Progress
              percent={percent}
              steps={5} // mỗi ô là 5 đơn vị
              showInfo={false}
              strokeColor={percentColor}
            />
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="Thời gian">
          <Space><CalendarOutlined style={{ color: '#1677ff' }} />
            {tuNgay} - {denNgay}
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="Lịch học">
          <Space><ClockCircleOutlined style={{ color: '#fa8c16' }} />
            <Text > {dow}, {lophoc.GioHoc}</Text>
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="Phòng học">
          <Space><EnvironmentOutlined style={{ color: '#8c8c8c' }} />
            {lophoc.PhongHoc ?? 'Chưa cập nhật'}
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label='Học phí'>
          <Text >
            <DollarCircleOutlined style={{ color: '#52c41a' }} /> {lophoc.HocPhi}
          </Text>
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