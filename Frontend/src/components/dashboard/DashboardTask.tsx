
import { Alert, Card, notification, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboardApi';
import { useEffect, useState } from 'react';
import { type TaskDB } from './DashboardDTO';

const DashboardTask = () => {
  const navigate = useNavigate()
  const [tasksToday, setTasksToday] = useState<TaskDB[]>([])
  const totalTask = tasksToday.length

  const fetchTasks = async () => {
    try {
      const res = await dashboardApi.getTasks()
      setTasksToday(res.data)
    } catch (error: any) {
      notification.error({
        title: 'Có lỗi xảy ra',
        description: error?.response?.data?.message,
        showProgress: true,
        pauseOnHover: true
      })
      console.log('Có lỗi xảy ra: ', error?.response?.data?.message)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const fourTasks = tasksToday.slice(0, 4).map(item => {
    let TieuDe
    let MoTa
    let Loai: "error" | "warning" | "info" | "success" | undefined

    switch (item.Loai) {
      case 'REQUEST': // yêu cầu mở khóa
        TieuDe = `Yêu cầu mở khóa: lớp ${item.TenLop}`,
          MoTa = `GV: ${item.GiaoVien} - Lý do: ${item.LoiNhan} (Buổi ${item.BuoiSo})`,
          Loai = 'error'
        break;

      case 'UNSUBMIT': // chưa nộp kết quả
        TieuDe = `Chưa nộp điểm danh: Lớp ${item.TenLop}`,
          MoTa = `GV: ${item.GiaoVien} chưa nộp kết quả ngày ${item.Ngay}.`,
          Loai = 'info'
        break;

      default: // tạo thêm lịch học
        TieuDe = `Bổ sung lịch học: Lớp ${item.TenLop}`,
          MoTa = `${item.LoiNhan}`,
          Loai = 'warning'
        break;
    }
    return <div
      onClick={() => navigate(`/admin/classes/${item.LopHocID}`)}
      style={{ cursor: 'pointer' }}
    >
      <Alert
        title={TieuDe}
        description={MoTa}
        type={Loai}
        showIcon
      />
    </div>
  })

  return (
    <>
      <Card title={`Việc cần làm (${totalTask})`} variant='borderless'
        styles={{
          header: { backgroundColor: '#fff8e6', color: '#d97109' }
        }}
        style={{ borderRadius: 8 }}
        extra={
          <a onClick={() => navigate(`/admin/tasks`)}>Xem tất cả</a>
        }
      >
        {/* việc cần làm */}
        <Space orientation="vertical" style={{ width: '100%' }}>
          {fourTasks}
        </Space>
      </Card>
    </>
  )
}

export default DashboardTask