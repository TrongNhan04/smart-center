import { Button, Space, Drawer, Divider } from 'antd';
import { useEffect, useState } from 'react';
import type { SessionDB } from '../session/SessionDTO';
import { sessionApi } from '../../api/sessionApi';
import { useNavigate, useParams } from 'react-router-dom';
import { CatchError } from '../common/catch.error';
import { useAuthStore } from '../../store/useAuthStore';

interface Props {
  open: boolean,
  onCancel: () => void
}

const NavigateDrawer = ({ open, onCancel }: Props) => {
  const navigate = useNavigate()
  const { classId, sessionId } = useParams()
  const [sessions, setSessions] = useState<SessionDB[]>([])
  const lopHocId = Number(classId)
  const user = useAuthStore(state => state.user)
  const role = user?.role.toLowerCase()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await sessionApi.getByClassId(lopHocId)
        setSessions(res.data)
      } catch (error: any) {
        CatchError.HandleError(error)
      }
    }

    fetchData()
  }, [])

  return (

    <Drawer
      title="Danh sách buổi học"
      size={500}
      placement="right"
      onClose={() => onCancel()}
      open={open}
    >
      <div style={{
        display: 'flex',
        flexWrap: 'wrap', // giữ khoảng cách và xuống dòng
        paddingBottom: 8,
        gap: '8px', // khoảng cách giữa các nút
        justifyContent: 'center'
      }}>
        {sessions.map(item => {
          // Xác định màu sắc của nút
          const isCurrent = item.ID === Number(sessionId)
          const isDone = item.TrangThai === 'COMPLETED'
          const isCancel = item.TrangThai === 'CANCELLED'

          let btnType: 'primary' | 'default' | 'dashed' = 'default'
          let btnColor = ''

          if (isCurrent) btnType = 'primary' // đang chọn thì màu xanh
          else if (isDone) btnColor = '#52c41a' // đã chốt viền xanh lá
          else if (isCancel) btnColor = '#ff4d4f'// đã hủy viền màu đỏ

          return (
            <Button
              key={item.ID}
              shape="circle"
              type={btnType}
              style={{
                borderColor: btnColor, // màu viền
                color: btnColor, // màu số
                minWidth: 34
              }}

              onClick={() => {
                navigate(`/${role}/classes/${classId}/sessions/${item.ID}`);
                onCancel()
              }}
            >
              {item.BuoiSo}
            </Button>
          )
        })}
      </div>

      {/* chú thích  */}
      <div style={{ marginTop: 12, fontSize: 15, color: '#8c8c8c' }}>
        <Space orientation='vertical' size={0}>
          <Space>
            <div style={{
              width: 10, height: 10,
              backgroundColor: '#1890ff', borderRadius: '50%'
            }} /> Đang xem
          </Space>

          <Space>
            <div style={{
              width: 10, height: 10,
              border: '1px solid #52c41a', borderRadius: '50%'
            }} /> Đã chốt kết quả
          </Space>

          <Space>
            <div style={{
              width: 10, height: 10,
              border: '1px solid #d9d9d9', borderRadius: '50%'
            }} /> Chưa chốt / Chưa học
          </Space>

          <Space>
            <div style={{
              width: 10, height: 10,
              border: '1px solid #ff4d4f', borderRadius: '50%'
            }} /> Đã hủy
          </Space>
        </Space>
      </div>
      <Divider />
    </Drawer>
  )
}

export default NavigateDrawer;