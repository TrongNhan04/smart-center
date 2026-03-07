import { Link } from "react-router-dom"
import { type TaskDB } from "./DashboardDTO"
import { Badge, Card, notification, Table, Tag, Typography } from "antd"
import { useEffect, useState } from "react"
import { dashboardApi } from "../../api/dashboardApi"

const { Text } = Typography

const TaskList = () => {
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

  const columns = [
    { // Lớp học
      title: 'Thuộc lớp', dataIndex: 'TenLop', key: 'TenLop', width: 200,
      ellipsis: true,
      render: (name: string, task: TaskDB) =>
        <Link to={`/admin/classes/${task.LopHocID}`}> {name}</Link>
    },
    { // tiêu đề
      title: 'Tiêu đề', dataIndex: 'TieuDe', width: 200,
      key: 'TieuDe', ellipsis: true,
      filters: [
        { text: 'Yêu cầu mở khóa', value: 'REQUEST' },
        { text: 'Chưa nộp kết quả', value: 'UNSUBMIT' },
        { text: 'Bổ sung lịch học', value: 'CREATE_MORE' }
      ],
      onFilter: (value: any, task: TaskDB) => task.Loai === value,
      render: (_: any, task: TaskDB) => {
        const isEnding = task.Loai === 'ENDING_CLASS'
        if (task.Loai === 'REQUEST')
          return <Tag color={'red'}>Yêu cầu mở khóa</Tag>
        if (task.Loai === 'UNSUBMIT')
          return <Tag color={'blue'}>Chưa nộp kết quả</Tag>
        return <Tag color={'orange'}>
          {isEnding ? 'Kiểm tra lớp học' : 'Bổ sung lịch học'}
        </Tag>
      }
    },
    { // mô tả
      title: 'Nội dung', dataIndex: 'LoiNhan', key: 'LoiNhan',
      render: (_: any, task: TaskDB) => {
        if (task.Loai === 'REQUEST')
          return `GV: ${task.GiaoVien} - Lý do: ${task.LoiNhan} (Buổi ${task.BuoiSo})`
        if (task.Loai === 'UNSUBMIT')
          return `GV: ${task.GiaoVien} chưa nộp kết quả buổi ${task.BuoiSo}`
        return `${task.LoiNhan}`
      }

    }
  ]

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '90vh' }}>
      <Card title={`Việc cần làm hôm nay (${totalTask})`}
        styles={{
          header: { backgroundColor: '#e6f4ff', color: '#0958d9' }
        }}
      >

        {/* Bảng hiển thị dữ liệu */}
        <Table
          style={{ margin: 8 }}
          dataSource={tasksToday}
          columns={columns}
          //loading={loading}
          //pagination={{ defaultPageSize: 10 }}
          // pagination={{
          //   current: currentPage,
          //   pageSize: 12,
          //   total: total
          // }}
          // onChange={handleChange}
          rowKey="ID"
          scroll={{ x: 1100, y: 408 }}
        />
      </Card>
    </div>
  )
}

export default TaskList