import { useEffect, useState } from "react"
import type { EnrollDB } from "./EnrollDTO"
import { enrollApi } from "../../api/enrollApi"
import {
  Badge,
  Button, Card, Col, Input, message, Popconfirm, Row, Select, Space, Table,
  Tag, Tooltip, Typography
} from "antd"
import { Link, useSearchParams } from "react-router-dom"
import {
  CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined,
  LockOutlined, PlusOutlined, ReadOutlined, SearchOutlined, UserOutlined
} from "@ant-design/icons"
import EnrollModal from "./EnrollModal"
import { CatchError } from "../common/catch.error"

const { Text } = Typography

const EnrollList = () => {
  const [enrolls, setEnrolls] = useState<EnrollDB[]>([])
  const [enrollId, setEnrollId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false) // open modal
  const [filterStatus, setFilterStatus] = useState('')
  const [searchParam, setSearchParam] = useSearchParams()
  const currentPage = Number(searchParam.get('page')) || 1

  const fetchEnrolls = async (keyword: string) => {
    setLoading(true)
    try {
      const res = await enrollApi.findMany(keyword, filterStatus)
      setEnrolls(res.data)
    } catch (error: any) {
      CatchError.HandleError(error)
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEnrolls('')
  }, [])

  const handleInactive = async (enrollId: number) => {
    try {
      await enrollApi.delete(enrollId)
      message.success('Thao tác thành công')
      handleSaveModal(enrollId)
    } catch (error) {
      CatchError.HandleError(error)
    }
  }

  const handleSaveModal = (enrollId: number) => {
    setEnrollId(enrollId)
    fetchEnrolls('')
    setTimeout(() => {
      setEnrollId(null)
    }, 3000)
  }

  const changeTablePage = (pagination: any) => {
    setSearchParam({ page: pagination.current })
  }

  const columns = [
    { // mã học viên
      title: 'Mã HV', dataIndex: 'MaHocVien', //width: 120,
      key: 'MaHocVien', align: 'center' as const,
      render: (code: string) => <Text code>{code}</Text>
    },
    { // Học viên
      title: 'Học viên', dataIndex: 'TenHocVien', //width: 220,
      key: 'TenHocVien', ellipsis: true,
      render: (name: string, enroll: EnrollDB) =>
        <Link to={`/admin/students/${enroll.HocVienID}`}
          style={{ fontWeight: 'bold' }}>
          <UserOutlined style={{ color: '#8c8c8c' }} /> {name}
        </Link>
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
      onFilter: (value: any, enroll: EnrollDB) =>
        new Date(enroll.NgayGhiDanh).getMonth() === value,
      render: (day: string) => <Text>
        <Text><CalendarOutlined style={{ color: '#8c8c8c' }} /> {new Date(day).toLocaleDateString()}</Text>
      </Text>
    },
    { // tên lớp
      title: 'Lớp học', dataIndex: 'TenLop', //width: 220,
      key: 'TenLop', ellipsis: true,
      render: (className: string) =>
        <Space >
          <ReadOutlined style={{ color: '#8c8c8c' }} />{className}
        </Space>
    },
    { // trạng thái
      title: 'Trạng thái', dataIndex: 'TrangThai',
      key: 'TrangThai', //width: 160,
      render: (value: string) => {
        return value === 'ACTIVE' ? 
        <Badge color='green' text="Thành công"/> : 
        <Badge color='red' text="Đã hủy"/>
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
              <Button
                size="small"
                icon={<DeleteOutlined />}
                type="link"
                danger
              />
            </Popconfirm>
          </Tooltip>
        else return <Tooltip title='Không thể thao tác'>
          <Button icon={<LockOutlined />} type="text" />
        </Tooltip>
      }
    },
  ]

  return (
    <div style={{ padding: 10, background: '#f5f5f5', minHeight: '90vh' }}>
      <Card title={`Danh sách ghi danh`}
        styles={{
          header: { backgroundColor: '#e6f4ff', color: '#0958d9' }
        }}
      >
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
            (record) =>
              record.ID === enrollId ? 'highlight-row' : ''
          }
          // pagination={{ defaultPageSize: 10 }}
          pagination={{
            current: currentPage,
            pageSize: 20
          }}
          onChange={changeTablePage}
          rowKey="ID"
          scroll={{ x: 1100, y: 408 }}
        />

        {/* Hiển thị Modal UI */}
        <EnrollModal
          open={isOpen}
          onCancel={() => setIsOpen(false)}
          onSave={handleSaveModal}
        />
      </Card>
    </div>
  )
}

export default EnrollList