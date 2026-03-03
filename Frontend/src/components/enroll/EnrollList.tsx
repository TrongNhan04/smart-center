import { useEffect, useState } from "react"
import type { EnrollDB } from "./EnrollDTO"
import { enrollApi } from "../../api/enrollApi"
import {
  Button, Card, Col, Input, message, notification, Popconfirm, Row,
  Select, Table, Tag, Tooltip, Typography
} from "antd"
import { Link, useLocation } from "react-router-dom"
import {
  CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined,
  DeleteOutlined, PlusOutlined, SearchOutlined
} from "@ant-design/icons"
import EnrollModal from "./EnrollModal"

const { Text } = Typography

const EnrollList = () => {
  const [enrolls, setEnrolls] = useState<EnrollDB[]>([])
  const [enrollId, setEnrollId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false) // open modal
  const [filterStatus, setFilterStatus] = useState('')
  const location = useLocation()

  const handelError = (error: any) => {
    notification.error({
      title: 'Có lỗi xảy ra',
      description: error.response.data.message,
      showProgress: true,
      pauseOnHover: true
    })
    console.log('Có lỗi xảy ra: ', error.response.data.message)
  }

  const fetchEnrolls = async (keyword: string) => {
    setLoading(true)
    try {
      const res = await enrollApi.findMany(keyword, filterStatus)
      setEnrolls(res.data)
    } catch (error: any) {
      handelError(error)
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEnrolls('')
  }, [filterStatus])

  const handleInactive = async (enrollId: number) => {
    try {
      await enrollApi.delete(enrollId)
      message.success('Thao tác thành công')
      handleSaveModal(enrollId)
    } catch (error) {
      handelError(error)
    }
  }

  const handleSaveModal = (enrollId: number) => {
    console.log('enrollId: ', enrollId)
    setEnrollId(enrollId)
    fetchEnrolls('')
    setTimeout(() => {
      setEnrollId(null)
    }, 3000)
  }

  const columns = [
    { // mã học viên
      title: 'Mã HV', dataIndex: 'MaHocVien', //width: 120,
      key: 'MaHocVien', align: 'center' as const,
      render: (code: string) => <Text code>{code}</Text>
    },
    { // tên học viên
      title: 'Tên học viên', dataIndex: 'TenHocVien', //width: 220,
      key: 'TenHocVien', ellipsis: true,
      render: (name: string, enroll: EnrollDB) =>
        <Link to={`/admin/students/${enroll.HocVienID}`}
          style={{ fontWeight: 'bold' }}>{name}</Link>
    },
    { // tên lớp
      title: 'Lớp học', dataIndex: 'LopHocID', //width: 220,
      key: 'LopHocID', ellipsis: true,
      render: (classId: number, enroll: EnrollDB) =>
        <Link to={`/admin/classes/${classId}`}>{enroll.TenLop}</Link>
    },
    { // ngày ghi danh
      title: 'Ngày ghi danh', dataIndex: 'NgayGhiDanh',
      key: 'NgayGhiDanh', //width: 150,
      filters: [
        { text: "Tháng 1", value: 0 }, { text: "Tháng 2", value: 1 },
        { text: "Tháng 3", value: 2 }, { text: "Tháng 4", value: 3 },
        { text: "Tháng 5", value: 4 }, { text: "Tháng 6", value: 5 },
        { text: "Tháng 7", value: 6 }, { text: "Tháng 8", value: 7 },
        { text: "Tháng 9", value: 8 }, { text: "Tháng 10", value: 9 },
        { text: "Tháng 11", value: 10 }, { text: "Tháng 12", value: 11 },
      ],
      onFilter: (value: any, enroll: EnrollDB) => {
        return new Date(enroll.NgayGhiDanh).getMonth() === value
      },
      render: (enrollDate: string) => <Text>
        <CalendarOutlined /> {new Date(enrollDate).toLocaleDateString()}
      </Text>
    },
    { // trạng thái
      title: 'Trạng thái GD', dataIndex: 'TrangThai',
      key: 'TrangThai', //width: 160,
      render: (value: string) => {
        if (value === 'ACTIVE')
          return <Tag color='green'><CheckCircleOutlined /> Thành công</Tag>
        else
          return <Tag color='error'><CloseCircleOutlined /> Đã hủy</Tag>
      }
    },
    {// thao tác
      title: 'Thao tác', key: 'action', align: 'center' as const, //width: 150,
      render: (_: any, enroll: EnrollDB) => {
        if (enroll.TrangThai === 'ACTIVE')
          return <Tooltip title="Hủy ghi danh">
            <Popconfirm
              title="Xác nhận hủy?"
              description="Hủy ghi danh sẽ đồng thời hủy HÓA ĐƠN"
              okText="Hủy ghi danh"
              cancelText="Quay lại"
              onConfirm={() => handleInactive(enroll.ID)}
              okButtonProps={{ danger: true }}
            >
              <Button size="small" icon={<DeleteOutlined />} type="primary" danger></Button>
            </Popconfirm>
          </Tooltip>
        else return <>Không thể thao tác</>
      }
    },
    // { // ghi chú
    //   title: 'Ghi chú', dataIndex: 'GhiChu', key: "GhiChu",
    //   render: (value: string) => !value || '' ? '-' : value
    // }
  ]

  return (
    <Card title={`Danh sách ghi danh`}>
      {/* ô tìm kiếm và bộ lọc */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Input.Search // ô tìm kiếm
            placeholder='Tìm theo tên hoặc mã...'
            prefix={<SearchOutlined />}
            allowClear

            onSearch={fetchEnrolls}
          />
        </Col>

        <Col span={3}>
          <Select // bộ lọc
            placeholder='Trạng thái'
            style={{ width: '100%' }}
            allowClear
            onChange={(e) => setFilterStatus(e)}
            options={[
              { label: 'Thành công', value: 'ACTIVE' },
              { label: 'Đã hủy', value: 'INACTIVE' },
            ]}
          >
          </Select>
        </Col>
        <Col style={{ marginLeft: 'auto' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsOpen(true)}
          > Ghi danh mới
          </Button>
        </Col>
      </Row>
      {/* Bảng hiển thị dữ liệu */}
      <Table
        dataSource={enrolls}
        columns={columns}
        loading={loading}
        rowClassName={
          (record) => {
            return record.ID === enrollId ? 'highlight-row' : ''
          }
        }
        pagination={{ defaultPageSize: 10 }}
        rowKey="ID"
        scroll={{ x: 1100, y: 426 }}
      />

      {/* Hiển thị Modal UI */}
      <EnrollModal
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        onSave={handleSaveModal}
      />
    </Card>
  )
}

export default EnrollList