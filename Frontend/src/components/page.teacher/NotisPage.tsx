import { useEffect, useState } from "react"
import type { TeacherNotis } from "../dashboard/DashboardDTO"
import { CatchError } from "../common/catch.error"
import { Button, Card, Table, Tag, Tooltip, Typography } from "antd"
import teacherApi from "../../api/teacherApi"
import { InfoCircleOutlined, StarOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"

const { Text } = Typography

const NotisPage = () => {
  const [notisToday, setNotisToday] = useState<TeacherNotis[]>([])
  const navigate = useNavigate()
  const fetchNotis = async () => {
    try {
      const res = await teacherApi.getMyNotis()
      setNotisToday(res.data.items)
    } catch (error) {
      CatchError.HandleError(error)
    }
  }

  useEffect(() => {
    fetchNotis()
  }, [])

  const ReadOneNotis = async (id: number) => {
    try {
      await teacherApi.readOneNotis(id)
      fetchNotis()
    } catch (error) {
      CatchError.HandleError(error)
    }
  }

  const columns = [
    { // tiêu đề
      dataIndex: 'TieuDe', width: 150,
      key: 'TieuDe', ellipsis: true,
      render: (_: any, notis: TeacherNotis) => {
        let color = notis.DaDoc ? 'default' : 'blue'
        return <Text><StarOutlined /> <Tag color={color}>Hệ thống</Tag></Text>
      }
    },
    { // nội dung
      dataIndex: 'NoiDung', key: 'NoiDung', ellipsis: true,
      onHeaderCell: () => ({ style: { textAlign: 'center' as const } }),
      render: (value: string, notis: TeacherNotis) =>
        <>
          <Text strong={notis.DaDoc ? false : true}>
            {notis.TieuDe}
          </Text>
          <Text> - {value}</Text>
        </>
    },
    { // thời gian
      dataIndex: 'ThoiGian', key: 'ThoiGian', width: 150,
      align: 'right' as const,
      render: (value: string, notis: TeacherNotis) => {
        const dateNotis = new Date(value)
        const date = dateNotis.getDate()
        const month = dateNotis.getMonth()
        const isLastYear = new Date().getFullYear() - dateNotis.getFullYear()
        let end = 4
        if (date < 9 && month < 9) // ngày < 10 và tháng < 10
          end = 3
        else if (date > 8 && month > 8) // ngày > 9 và tháng > 9, >= 10 là hốt
          end = 5
        else if (isLastYear > 0) end = 0
        const dateStr = end === 0 ?
          dateNotis.toLocaleDateString()
          : dateNotis.toLocaleDateString().slice(0, end).replace('/', ' thg ')
        return <Text strong={notis.DaDoc ? false : true}>
          {dateStr}
        </Text>
      }
    },
    {// thao tác
      dataIndex: 'DuLieu', key: 'DuLieu', width: 120,
      align:'center' as const,
      render: (value: { classId: number, sessionId: number }) => {
        const { classId, sessionId } = value
        return <Tooltip title='Đi đến buổi học'>
          <Button
            type="link"
            icon={<InfoCircleOutlined />}
            onClick={() => navigate(`/teacher/classes/${classId}/sessions/${sessionId}`)}
          />
        </Tooltip>
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
          onRow={(record) => {
            return {
              onClick: () => ReadOneNotis(record.ID)
            }
          }}
          dataSource={notisToday}
          columns={columns}
          pagination={false}
          rowKey="ID"
          scroll={{ x: 1100, y: 515 }}
        />
      </Card>
    </div>
  )
}

export default NotisPage