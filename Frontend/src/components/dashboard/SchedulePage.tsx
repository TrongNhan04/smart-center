import { Badge, Calendar, Card, Col, List, Row, Space, Typography, type CalendarProps, } from "antd"
import { createStyles } from "antd-style"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"
import { useEffect, useRef, useState } from "react"
import type { ClassSchedule } from "./DashboardDTO"
import { ClockCircleOutlined, EnvironmentOutlined, UserOutlined } from "@ant-design/icons"
import { CatchError } from "../common/catch.error"
import { dashboardApi } from "../../api/dashboardApi"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../../store/useAuthStore"

const { Text, Title } = Typography

const useStyles = createStyles(({ token }) => ({
  root: {
    padding: 10,
    backgroundColor: token.colorPrimaryBg
  }
}))

const stylesFn: CalendarProps<Dayjs>['styles'] = (info) => {
  if (info.props.fullscreen) {
    return {
      root: {
        border: '2px solid #BD3C3',
        borderRadius: 10,
        backgroundColor: 'rgba(69, 201, 88, 0.3)'
      }
    } satisfies CalendarProps<Dayjs>['styles']
  }
}

const SchedulePage = () => {
  const { styles: classNames } = useStyles()
  const role = useAuthStore(state=>state.user?.role)
  // lưu ngày tháng hiện tại
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [scheduleData, setScheduleData] = useState<ClassSchedule[]>([])
  // lưu ngày tháng trước đó
  const currentMonthRef = useRef<Dayjs | null>(null)
  const navigate = useNavigate()

  useEffect(() => {

    const fetchSession = async () => {
      try {
        const isSameMonth = currentMonthRef.current?.isSame(selectedDate, 'month')
        // nếu chọn ngày có tháng khác tháng trước đó thì mới call api
        if (isSameMonth) return
        const res = await dashboardApi.getSessionsOfMonth(
          selectedDate.month(),
          selectedDate.year()
        )
        setScheduleData(res.data)
      } catch (error) {
        CatchError.HandleError(error)
      }
    }

    fetchSession()
    // currentMonthRef = ngày trước đó của selectedDate trước khi rerender
    currentMonthRef.current = selectedDate
  }, [selectedDate])

  // lấy các buổi học theo ngày được chọn
  const getClassesByDate = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD')
    return scheduleData.filter(item => item.NgayHoc === dateStr)
  }

  // click ô nào lấy thời gian ô đó
  const onSelect = (value: Dayjs) => setSelectedDate(value)

  // render nội dung từng ô của lịch
  const cellRender = (value: Dayjs) => {
    // lấy các buổi học theo value
    const dailyClasses = getClassesByDate(value)
    const totalClass = dailyClasses.length
    if (totalClass == 0) return null

    return (
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {dailyClasses.slice(0, 2).map(item =>
          <li key={item.ID} style={{ marginBottom: 0 }}>
            <Badge
              status='success'
              text={<span style={{ fontSize: 12 }}>{item.GioHoc}</span>}
            />
          </li>
        )}
        {dailyClasses.length > 2 && // nếu hơn 2 buổi thì hiện more
          <li>
            <Badge status='error'
              text={<span style={{ fontSize: 12 }}>
                {dailyClasses.length - 2} more </span>} />
          </li>
        }
      </ul>
    )
  }
  // các lớp của ngày đã chọn
  const classOfDate = getClassesByDate(selectedDate)

  return (
    <div style={{ padding: 18, background: '#f5f5f5', minHeight: '100vh' }}>
      <Row gutter={[18, 18]}>

        <Col xs={24} lg={18}>
          {/* <Card variant="borderless" > */}
          <Calendar classNames={classNames} styles={stylesFn}
            onSelect={onSelect} cellRender={cellRender} />
          {/* </Card> */}
        </Col>

        <Col xs={24} lg={6}>
          <Card
            title={`Thời khóa biểu ${selectedDate.format('DD/MM/YYYY')}`}
            variant="borderless"
            styles={{ header: { backgroundColor: '#f0f5ff', color: '#1d39c4' } }}
          >
            {classOfDate.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
                Chưa có lịch học
              </div>
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={classOfDate}
                renderItem={item => (
                  <List.Item
                    onClick={
                      () => {
                        const naviByRole = role==='ADMIN' ? 'admin' : 'teacher'
                        navigate(`/${naviByRole}/classes/${item.LopHocID}/sessions/${item.ID}`)
                      }
                    }
                    style={{
                      padding: '10px',
                      marginBottom: 15,
                      background: '#f0f5ff',
                      borderRadius: 8,
                      border: '1px solid #f0f0f0',
                      borderLeft: `5px solid #1890ff`,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ width: '100%' }}>
                      <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
                        <Title level={5} style={{ margin: 0 }}>{item.TenLop}</Title>
                      </Row>

                      <Space orientation="vertical" size={1} style={{ width: '100%' }}>
                        <Text >
                          <ClockCircleOutlined /> Thời gian: <Text strong>{item.GioHoc}</Text>
                        </Text>
                        <Text >
                          <EnvironmentOutlined /> Phòng học: <Text strong>{item.PhongHoc ?? '_'}</Text>
                        </Text>
                        <Text >
                          <UserOutlined /> Học viên: <Text strong>{item.TongGhiDanh}</Text>
                        </Text>
                      </Space>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default SchedulePage


// useEffect(() => {
//   let ignore = false; // Biến cờ để chống Race Condition

//   const fetchSession = async () => {
//     try {
//       const isSameMonth = currentMonthRef.current?.isSame(selectedDate, 'month');
      
//       // Nếu cùng tháng thì thôi, và cập nhật Ref ngay để lần sau ko lọt vào đây
//       if (isSameMonth) return;

//       const res = await dashboardApi.getSessionsOfMonth(
//         selectedDate.month(),
//         selectedDate.year()
//       );

//       // Chỉ set data nếu đây là yêu cầu mới nhất
//       if (!ignore) {
//         setScheduleData(res.data);
//         currentMonthRef.current = selectedDate; // Chỉ cập nhật Ref khi fetch xong/thay đổi tháng
//       }
//     } catch (error) {
//       if (!ignore) CatchError.HandleError(error);
//     }
//   };

//   fetchSession();

//   return () => {
//     ignore = true; // Khi selectedDate thay đổi lần nữa, yêu cầu cũ sẽ bị bỏ qua
//   };
// }, [selectedDate]);