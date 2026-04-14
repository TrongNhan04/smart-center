import { Link, useNavigate } from "react-router-dom"
import { type AdminNotis, type ReminderTeacher  } from "./DashboardDTO"
import { Button, Card, message, Popconfirm, Table, Tag, Typography } from "antd"
import { useEffect, useState } from "react"
import { dashboardApi } from "../../api/dashboardApi"
import { BellOutlined, CheckCircleOutlined, CheckOutlined, MessageOutlined, PlusCircleOutlined, ReadOutlined } from "@ant-design/icons"
import { CatchError } from "../common/catch.error"

const {Text} = Typography

const NotisList = () => {
  const navigate = useNavigate()
  const [notisToday, setNotisToday] = useState<AdminNotis[]>([])
  const [remindList, setRemindList] = useState<number[]>(() => {
    const savedData = localStorage.getItem('remindedTasks')
    return savedData ? JSON.parse(savedData) : []
  })

  const fetchTasks = async () => {
    try {
      const res = await dashboardApi.getTasks()
      const formatRes = res.data.map((item: AdminNotis, index: number) => ({
        index, // thêm index để không cảnh báo thiếu unique key
        ...item
      }))
      setNotisToday(formatRes)
    } catch (error) {
      CatchError.HandleError(error)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleRemindTeacher = async (task: AdminNotis) => {
    try {
      const payload: ReminderTeacher = {
        classId: task.LopHocID,
        ssNumber: task.BuoiSo
      }
      await dashboardApi.reminderTeacher(task.GiaoVienID, payload)
      // lưu id buổi học để biết buổi này có cần nhắc nhở không
      const newList = [...remindList, task.BuoiHocID]
      setRemindList(newList)
      message.success('Đã tạo thông báo đến giáo viên!')
      localStorage.setItem('remindedTasks', JSON.stringify(newList))
    } catch (error) {
      CatchError.HandleError(error)
    }
  }
  const handleUnlock = async (sessionId: number) => {
    try {
      await dashboardApi.unlock(sessionId)
      fetchTasks()
      message.success('Thao tác thành công')
    } catch (error) {
      CatchError.HandleError(error)
    }
  }

  const columns = [
    { // tiêu đề
      title: 'Tiêu đề', dataIndex: 'TieuDe', width: 200,
      key: 'TieuDe', ellipsis: true,
      filters: [
        { text: 'Yêu cầu mở khóa', value: 'REQUEST' },
        { text: 'Chưa chốt kết quả', value: 'UNSUBMIT' },
        { text: 'Bổ sung lịch học', value: 'CREATE_MORE' }
      ],
      onFilter: (value: any, task: AdminNotis) => task.Loai === value,
      render: (_: any, task: AdminNotis) => {
        if (task.Loai === 'REQUEST')
          return <Tag color={'red'}>Yêu cầu mở khóa</Tag>
        if (task.Loai === 'UNSUBMIT')
          return <Tag color={'purple'}>Chưa chốt kết quả</Tag>
        return <Tag color={'orange'}>Bổ sung lịch học</Tag>
      }
    },
    { // mô tả
      title: 'Nội dung', dataIndex: 'LoiNhan', key: 'LoiNhan',
      render: (_: any, task: AdminNotis) => {
        const date = new Date(task.Ngay).toLocaleDateString()
        let message = task.LoiNhan
        if (task.Loai === 'REQUEST')
          message = `GV: ${task.GiaoVien} - Lý do: ${task.LoiNhan} (Buổi ${task.BuoiSo}) - Ngày gửi yêu cầu: ${date}`
        if (task.Loai === 'UNSUBMIT')
          message =  `GV: ${task.GiaoVien} chưa nộp kết quả buổi ${task.BuoiSo}`
        return <Text><MessageOutlined style={{ color: '#8c8c8c' }}/> {message}</Text>
      }
    },
    { // Lớp học
      title: 'Thuộc lớp', dataIndex: 'TenLop', key: 'TenLop', width: 200,
      ellipsis: true,
      render: (name: string, task: AdminNotis) =>
        <Link to={`/admin/classes/${task.LopHocID}`}>
          <ReadOutlined style={{ color: '#8c8c8c' }} /> {name}
        </Link>
    },
    { // thao tác
      title: 'Thao tác', dataIndex: 'ThaoTac', key: 'ThaoTac',
      align: 'center' as const, width: 180,
      render: (_: any, task: AdminNotis) => {
        if (task.Loai === 'REQUEST')
          return <Popconfirm
            title="Xác nhận mở khóa cho buổi học này?"
            onConfirm={() => handleUnlock(task.BuoiHocID)}
            okText="Duyệt"
            cancelText="Hủy"
          >
            <Button size="small"
              icon={<CheckCircleOutlined />}
              style={{ backgroundColor: '#52c41a', color: '#fff' }}
            > Duyệt</Button>
          </Popconfirm>
        if (task.Loai === 'UNSUBMIT') {
          // kiểm tra có phải buổi học đã nhắc rồi hay không
          const isReminded = remindList.includes(task.BuoiHocID)
          return <Button
            size="small"
            style={{
              color: isReminded ? '#1677ff' : '',
              background: '#f0f5ff'
            }}
            disabled={isReminded ? true : false}
            icon={isReminded ? <CheckOutlined /> : <BellOutlined />}
            onClick={() => handleRemindTeacher(task)}
          >{isReminded ? 'Đã nhắc' : 'Nhắc GV'}</Button>
        }

        return <Button
          size="small"
          icon={<PlusCircleOutlined />}
          onClick={() => navigate(`/admin/classes/${task.LopHocID}`)}>
          Bổ sung
        </Button>
      }
    }
  ]

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '90vh' }}>
      <Card title={`Thông báo`}
        styles={{
          header: { backgroundColor: '#e6f4ff', color: '#0958d9' }
        }}
      >

        {/* Bảng hiển thị dữ liệu */}
        <Table
          style={{ margin: 8 }}
          dataSource={notisToday}
          columns={columns}
          pagination={{ defaultPageSize: 10 }}
          rowKey="index"
          scroll={{ x: 1100, y: 408 }}
        />
      </Card>
    </div>
  )
}

export default NotisList