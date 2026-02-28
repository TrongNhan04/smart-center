import { Button, Space, Tooltip } from "antd"
import type { InvoiceDB } from "./InvoiceDTO"
import { DollarCircleOutlined, InfoCircleOutlined, RollbackOutlined } from "@ant-design/icons"

interface Props {
  invoice: InvoiceDB
  onAddReceipt: (invoice: InvoiceDB) => void
  onAddPayment: (invoice: InvoiceDB) => void
}

const InvoiceAction = ({ invoice, onAddReceipt, onAddPayment }: Props) => {
  const btnInfo = () => <Tooltip title="Xem chi tiết">
    <Button
      // size="middle"
      type="text"
      icon={<InfoCircleOutlined />}
    //onClick={() => onEdit(course)}
    >
    </Button>
  </Tooltip>

  if (invoice.TrangThai === 'CANCELLED') {
    return <Space size='small'>
      {btnInfo()}

      {/* nút thêm phiếu chi */}
      <Tooltip title="Thêm phiếu chi">
        <Button
          // size="small"
          type="primary"
          danger
          ghost
          icon={<RollbackOutlined />}
          onClick={() => onAddPayment(invoice)}
        >
        </Button>
      </Tooltip>
    </Space>
  }

  return (
    <Space size="small">
      {/* Nút xem chi tiết  */}
      {btnInfo()}

      {/* nút thêm phiếu thu */}
      <Tooltip title="Thêm phiếu thu">
        <Button
          // size="small"
          type="primary"
          icon={<DollarCircleOutlined />}
          onClick={() => onAddReceipt(invoice)}
        >
        </Button>
      </Tooltip>
    </Space>
  )
}

export default InvoiceAction