import { Button, notification, Popconfirm, Space } from "antd"
import type { TSessionDetail } from "../session/SessionDTO"
import { CheckCircleOutlined, SaveOutlined } from "@ant-design/icons"
import { DateHelper } from "../common/date.helper"
import { useState } from "react"
import teacherApi from "../../api/teacherApi"
import { useAuthStore } from "../../store/useAuthStore"

interface Props {
  session: TSessionDetail
  onSave: (type: 'DRAFT' | 'SUBMITTED') => void
  onReload: () => void
}

const UnlockButton = ({ session, onSave, onReload }: Props) => {
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [loadingRequest, setLoadingRequest] = useState(false)
  const isAdmin = useAuthStore.getState().user?.role === 'ADMIN'

  const handleSendRequest = async () => {
    setLoadingRequest(true)
    try {
      const reason = `Cập nhật kết quả`
      await teacherApi.requestUnlock(session.ID, reason)
      onReload()
    } catch (error) {
      handelError(error)
    }
    finally{
      setLoadingRequest(false)
    }
  }

  const handelError = (error: any) => {
    notification.error({
      title: 'Có lỗi xảy ra',
      description: error?.response?.data?.message,
      showProgress: true,
      pauseOnHover: true
    })
    console.log(error)
    console.log('Có lỗi xảy ra: ', error?.response?.data?.message)
  }

  const timeLeft = DateHelper.TimeDiff(session.KetThucLuc)
  // cần mở khóa khi:
  // đã qua 48h và SCHEDULED || COMPLETED  || admin không mở khóa
  const isNeedUnlock = (timeLeft > 2880 && session.TrangThai === 'SCHEDULED'
    && session.AdminMoKhoa === false) || session.TrangThai === 'COMPLETED'

  const handleSaveDraft = () => {
    onSave('DRAFT')
    setLoadingDraft(true)
    setTimeout(() => {
      setLoadingDraft(false)
    }, 3000);
  }

  const handleSubmit = () => {
    onSave('SUBMITTED')
    setLoadingSubmit(true)
    setTimeout(() => {
      setLoadingSubmit(false)
    }, 3000);
  }  

  if (session.TrangThai === 'CANCELLED')
    return <Button type="default" disabled>
      Không thể thao tác
    </Button>

  else if (session.YeuCauMoKhoa){
    if(isAdmin)
      return <Button>Duyệt mở khóa</Button>
    return <Button
      type="primary"
      style={{ backgroundColor: '#2fb058', color: '#fff' }}
      icon={<CheckCircleOutlined />}
    >
      Đã gửi yêu cầu mở khóa
    </Button>
  }

  else if (isNeedUnlock && !isAdmin){
    return <Button type="primary"
      onClick={handleSendRequest} loading={loadingRequest}
    >
      Gửi yêu cầu mở khóa
    </Button>
  }
    

  return (
    <Space>
      <Button size="middle" icon={<SaveOutlined />} loading={loadingDraft}
        onClick={handleSaveDraft}
      > Lưu thông tin
      </Button>

      <Popconfirm
        title='Xác nhận chốt kết quả?'
        description='Kết quả sẽ được gửi thông báo đến phụ huynh'
        okText='Chốt kết quả'
        cancelText='Quay lại'
        onConfirm={handleSubmit}
      >
        <Button type="primary" size="middle" icon={<SaveOutlined />}
          loading={loadingSubmit}
        > Chốt kết quả
        </Button>
      </Popconfirm>
    </Space>
  )
}


export default UnlockButton