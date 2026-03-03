import { Button, Space, Tooltip } from "antd"
import type { InvoiceDB } from "./InvoiceDTO"
import { DollarCircleOutlined, InfoCircleOutlined, RollbackOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"

interface Props {
  invoice: InvoiceDB
  onAddReceipt: (invoice: InvoiceDB) => void
  onAddPayment: (invoice: InvoiceDB) => void
  // pagination: {
  //   page: number,
  //   pageSize: number
  // }
}

const InvoiceAction = ({
  invoice, onAddReceipt, onAddPayment }: Props) => {
  const navigate = useNavigate()

  const daTra = Number(invoice.DaTra)
  const conNo = Number(invoice.TongTien) - daTra
  const btnInfo = () =>
    <Tooltip title="Xem chi tiết">
      <Button
        // size="middle"
        type="text"
        icon={<InfoCircleOutlined />}
        onClick={() => navigate(`/admin/invoices/${invoice.ID}`)}
      >
      </Button>
    </Tooltip>

  if (invoice.TrangThai === 'CANCELLED') {
    return <Space size='small'>
      {btnInfo()}

      {/* nút thêm phiếu chi chỉ có khi CANCELLED và ĐÃ TRẢ > 0 */}
      {daTra > 0 &&
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
      }
    </Space>
  }

  return (
    <Space size="small">
      {/* Nút xem chi tiết  */}
      {btnInfo()}

      {/* nút thêm phiếu thu chỉ có khi CÒN NỢ > 0*/}
      {conNo > 0 &&
        <Tooltip title="Thêm phiếu thu">
          <Button
            // size="small"
            type="primary"
            icon={<DollarCircleOutlined />}
            onClick={() => onAddReceipt(invoice)}
          >
          </Button>
        </Tooltip>
        }
    </Space>
  )
}

export default InvoiceAction