import { Button, Popconfirm, Space } from "antd"
import type { TSessionDetail } from "../session/SessionDTO"
import { CheckCircleOutlined, SaveOutlined } from "@ant-design/icons"
import { DateHelper } from "../common/date.helper"
import { useState } from "react"
import teacherApi from "../../api/teacherApi"
import { useAuthStore } from "../../store/useAuthStore"
import { CatchError } from "../common/catch.error"

interface Props {
  session: TSessionDetail
  onSave: (type: 'DRAFT' | 'SUBMITTED') => void
  onReload: (id: number) => void
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
      onReload(session.ID)
    } catch (error) {
      CatchError.HandleError(error)
    }
    finally {
      setLoadingRequest(false)
    }
  }

  const timeLeft = DateHelper.TimeDiff(session.KetThucLuc)
  // cần mở khóa khi: admin không mở khóa và
  // đã qua 48h hoặc đã submit trước đó
  const isNeedUnlock = !session.AdminMoKhoa &&
    (timeLeft > 2880 || session.TrangThai === 'COMPLETED')

  const handleSaveDraft = () => {
    setLoadingDraft(true)
    setTimeout(() => {
      setLoadingDraft(false)
    }, 1000);
    onSave('DRAFT')
  }

  const handleSubmit = () => {
    setLoadingSubmit(true)
    setTimeout(() => {
      setLoadingSubmit(false)
    }, 1000);
    onSave('SUBMITTED')
  }

  if (session.TrangThai === 'CANCELLED' || isAdmin)
    return <Button type="default" disabled>
      Không thể thao tác
    </Button>
  // đã gửi yêu cầu nhưng admin chưa mở khóa
  else if (session.YeuCauMoKhoa && !session.AdminMoKhoa) {
    return <Button
      type="primary"
      style={{ backgroundColor: '#2fb058', color: '#fff' }}
      icon={<CheckCircleOutlined />}
    >
      Đã gửi yêu cầu mở khóa
    </Button>
  }

  else if (isNeedUnlock) {
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