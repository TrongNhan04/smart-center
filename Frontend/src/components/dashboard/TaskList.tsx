import { Link, useNavigate } from "react-router-dom"
import { type ReminderTeacher, type TaskDB } from "./DashboardDTO"
import { Button, Card, message, notification, Popconfirm, Table, Tag } from "antd"
import { useEffect, useState } from "react"
import { dashboardApi } from "../../api/dashboardApi"
import { BellOutlined, CheckCircleOutlined, CheckOutlined } from "@ant-design/icons"

const TaskList = () => {
  const navigate = useNavigate()
  const [tasksToday, setTasksToday] = useState<TaskDB[]>([])
  const [remindList, setRemindList] = useState<number[]>(() => {
    const savedData = localStorage.getItem('remindedTasks')
    return savedData ? JSON.parse(savedData) : []
  })

  const fetchTasks = async () => {
    try {
      const res = await dashboardApi.getTasks()
      setTasksToday(res.data)
    } catch (error) {
      handelError(error)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handelError = (error: any) => {
    notification.error({
      title: 'Có lỗi xảy ra',
      description: error?.response?.data?.message,
      showProgress: true,
      pauseOnHover: true
    })
    console.log('Có lỗi xảy ra: ', error?.response?.data?.message)
  }

  const handleRemindTeacher = async (task: TaskDB) => {
    try {
      const payload: ReminderTeacher = {
        classId: task.LopHocID,
        ssNumber: task.BuoiSo
      }
      await dashboardApi.reminderTeacher(task.GiaoVienID, payload)
      // lưu id buổi học để biết buổi này có cần nhắc nhở không
      const newList = [...remindList, task.BuoiHocID]
      setRemindList(newList)
      message.success('Đã gửi thông báo đến giáo viên!')
      localStorage.setItem('remindedTasks', JSON.stringify(newList))
    } catch (error) {
      handelError(error)
    }
  }
  const handleUnlock = async (sessionId: number) => {
    try {
      await dashboardApi.unlock(sessionId)
      fetchTasks()
      message.success('Thao tác thành công')
    } catch (error) {
      handelError(error)
    }
  }

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
        const date = new Date(task.Ngay).toLocaleDateString()
        if (task.Loai === 'REQUEST')
          return `GV: ${task.GiaoVien} - Lý do: ${task.LoiNhan} (Buổi ${task.BuoiSo}) - Ngày gửi yêu cầu: ${date}`
        if (task.Loai === 'UNSUBMIT')
          return `GV: ${task.GiaoVien} chưa nộp kết quả buổi ${task.BuoiSo}`
        return `${task.LoiNhan}`
      }
    },
    { // thao tác
      title: 'Thao tác', dataIndex: 'ThaoTac', key: 'ThaoTac',
      align: 'center' as const, width: 180,
      render: (_: any, task: TaskDB) => {
        if (task.Loai === 'REQUEST')
          return <Popconfirm
            title="Xác nhận mở khóa cho buổi học này?"
            onConfirm={() => handleUnlock(task.BuoiHocID)}
            okText="Duyệt"
            cancelText="Hủy"
          >
            <Button type="primary" size="small"
              icon={<CheckCircleOutlined />}
              style={{ backgroundColor: '#2fb058', color: '#fff' }}
            > Duyệt</Button>
          </Popconfirm>
        if (task.Loai === 'UNSUBMIT') {
          // kiểm tra có phải buổi học đã nhắc rồi hay không
          const isReminded = remindList.includes(task.BuoiHocID)
          return <Button
            size="small"
            type={isReminded ? 'default' : 'primary'}
            disabled={isReminded ? true : false}
            icon={isReminded ? <CheckOutlined /> : <BellOutlined />}
            onClick={() => handleRemindTeacher(task)}
          >{isReminded ? 'Đã nhắc' : 'Nhắc GV'}</Button>
        }

        return <Button size="small"
          onClick={() => navigate(`/admin/classes/${task.LopHocID}`)}>
          Bổ sung
        </Button>
      }
    }
  ]

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '90vh' }}>
      <Card title={`Việc cần làm hôm nay`}
        styles={{
          header: { backgroundColor: '#e6f4ff', color: '#0958d9' }
        }}
      >

        {/* Bảng hiển thị dữ liệu */}
        <Table
          style={{ margin: 8 }}
          dataSource={tasksToday}
          columns={columns}
          pagination={{ defaultPageSize: 10 }}
          rowKey="ID"
          scroll={{ x: 1100, y: 408 }}
        />
      </Card>
    </div>
  )
}

export default TaskList