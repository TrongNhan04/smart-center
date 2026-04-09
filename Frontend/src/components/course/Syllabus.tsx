import { Alert, Form, Input, Modal } from "antd"
import { useEffect } from "react"

interface Props {
  open: boolean,
  onCancel: () => void
}

const Syllabus = ({ open, onCancel }: Props) => {
  const [form] = Form.useForm()

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  useEffect(() => {
    if (open)
      form.resetFields()
  }, [open])

  const handleOK = async () => {
    const syllabus:any = await form.validateFields()
    if (!syllabus) return
    const data = syllabus.decuong
      .split('\n') // xuống dòng là cắt 1 ông
      .filter((line:string) => line.trim() !== '') // bỏ mấy dòng rỗng
      .map((line:string, index:number) => ({
        ThuTu: index + 1,
        NoiDung: line.trim()
      }))
    console.log(data)
  }

  return (
    <Modal
      title={'Đề cương khóa học'}
      open={open}
      onCancel={handleCancel}
      onOk={handleOK}
      width={600}
      okText="Lưu lại"
      cancelText="Hủy bỏ"
      centered // canh giữa màn hình
      maskClosable={false}
    //confirmLoading={loading}
    >
      <Alert
        title="Lưu ý"
        description="1 dòng tương ứng với 1 chủ đề buổi học"
        type="info"
        showIcon
        style={{ marginBottom: 15 }}
      />
      <Form form={form} layout="vertical" initialValues={{ decuong: '' }}>
        <Form.Item label='Đề cương khóa học' name="decuong">
          <Input.TextArea
            rows={20}
            placeholder="Lộ trình học,..."
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default Syllabus




// Chào hỏi và giới thiệu bản thân
// Bảng chữ cái và phát âm cơ bản
// Số đếm và ngày tháng
// Đại từ nhân xưng và động từ “to be”
// Gia đình và bạn bè
// Nghề nghiệp và nơi làm việc
// Thì hiện tại đơn (Present Simple)
// Thói quen hằng ngày
// Sở thích và giải trí
// Mô tả người và ngoại hình
// Địa điểm trong thành phố
// Chỉ đường và hỏi đường
// Thì hiện tại tiếp diễn (Present Continuous)
// Hoạt động đang diễn ra
// Thức ăn và đồ uống
// Gọi món và giao tiếp nhà hàng
// Thì quá khứ đơn (Past Simple)
// Kể về trải nghiệm trong quá khứ
// Du lịch và kỳ nghỉ
// Đặt phòng khách sạn và vé máy bay
// So sánh hơn và so sánh nhất
// Mua sắm và giá cả
// Sức khỏe và cơ thể
// Đi khám bệnh và mô tả triệu chứng
// Thì tương lai (will / going to)
// Kế hoạch và dự định
// Thời tiết và môi trường
// Công nghệ và mạng xã hội
// Giao tiếp qua điện thoại
// Viết email cơ bản
// Câu điều kiện loại 1
// Giải quyết vấn đề và đưa ra lời khuyên
// Câu bị động (Passive Voice)
// Tin tức và truyền thông
// Phỏng vấn xin việc
// Kỹ năng thuyết trình cơ bản
// Thành ngữ và cụm động từ (Phrasal verbs)
// Ôn tập ngữ pháp tổng hợp
// Luyện nghe và phản xạ giao tiếp
// Kiểm tra và tổng kết khóa học