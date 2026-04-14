import { useEffect, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import type { InvoiceForStu } from "./StudentDTO"
import { CatchError } from "../common/catch.error"
import { studentApi } from "../../api/studentApi"
import { Button, Table, Typography } from "antd"
import { AccountBookOutlined, CalendarOutlined, CheckCircleOutlined, InfoCircleOutlined, ReadOutlined } from "@ant-design/icons"

const { Text } = Typography

const TabInvoice = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoiceForStu, setInvoiceForStu] = useState<InvoiceForStu[]>([])
  const [searchParam, setSearchParam] = useSearchParams()
  const currentTab = searchParam.get('tab') || 'invoices'
  const currentPage = Number(searchParam.get('page')) || 1
  const studentId = Number(id)

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await studentApi.getInvoicesById(studentId)
        setInvoiceForStu(res.data)
      } catch (error) {
        CatchError.HandleError(error)
      }
    }
    fetchInvoices()
  }, [])

  const columns = [
    {
      title: 'Mã HD', dataIndex: 'MaHoaDon', key: 'MaHoaDon', width: 120,
      align: 'center' as const, render: (value: string) => <Text code>{value}</Text>
    },
    {
      title: 'Lớp', dataIndex: 'TenLop', key: 'TenLop',
      render: (value: string) => <Text>
        <ReadOutlined style={{ color: '#8c8c8c' }} /> {value}
      </Text>
    },
    {
      title: 'Học phí', dataIndex: 'TongTien', key: 'TongTien',
      align: 'right' as const,
      render: (value: number) => <Text >
        <AccountBookOutlined style={{ color: 'orange' }} /> {Number(value).toLocaleString()}đ
      </Text>
    },
    {
      title: 'Đã đóng', dataIndex: 'DaTra', key: 'DaTra',
      align: 'right' as const,
      render: (value: number) => <Text >
        <CheckCircleOutlined style={{ color: '#52c41a' }} /> {Number(value).toLocaleString()}đ
      </Text>
    },
    {
      title: 'Hạn thanh toán', dataIndex: 'ThoiHan', key: 'ThoiHan',
      align: 'center' as const,
      render: (value: string) => <Text>
        <CalendarOutlined style={{ color: '#1677ff' }} /> {new Date(value).toLocaleDateString()}
      </Text>
    },
    {
      title: 'Thao tác', dataIndex: 'ThaoTac', key: 'ThaoTac',
      align: 'center' as const,
      render: (_: any, invoice: InvoiceForStu) =>
        <Button
          size="small"
          icon={<InfoCircleOutlined />}
          type="text"
          onClick={() => navigate(`/admin/invoices/${invoice.ID}`)}
        />
    }
  ]


  return (
    <Table
      onChange={(page: any) => setSearchParam({
        tab: currentTab,
        page: page.current
      })}
      dataSource={invoiceForStu}
      columns={columns}
      rowKey='ID'
      scroll={{ y: 320 }}
      pagination={{
        pageSize: 1,
        current: currentPage
      }}
    />
  )
}

export default TabInvoice