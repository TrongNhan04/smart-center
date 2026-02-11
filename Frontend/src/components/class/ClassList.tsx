import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button, Card, Col, Input, message,
  Row, Select, Table
} from "antd";
import type { ClassDB } from "./ClassInterface";
import { useEffect, useState } from "react";
import classApi from "../../api/classApi";
import ClassColumn from "./ClassColumn";

const ClassList = () => {
  const [classes, setClasses] = useState<ClassDB[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const res = await classApi.findMany()
      setClasses(res.data)
      console.log("data fetch", res.data)
    } catch (error) {
      message.error("Có lỗi xảy ra!")
      console.log("Có lỗi hàm fetchClasses: ", error)
    }
    finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchClasses()
  }, [])
  const filteredData = classes.filter(item => {
    const lowerCase = searchText.toLocaleLowerCase()
    const matchesKeyword =
      item.TenLop.toLocaleLowerCase().includes(lowerCase) ||
      item.MaLopHoc.toLocaleLowerCase().includes(lowerCase) ||
      item.GiaoVien.HoTen.toLocaleLowerCase().includes(lowerCase)
    const matchesStatus = filterStatus ? item.TrangThai === filterStatus : true
    return matchesKeyword && matchesStatus
  })
  return (
    <Card title={`Danh sách lớp học (${classes.length})`}>
      {/* ô tìm kiếm và bộ lọc */}
      <Row gutter={16} style={{ marginBottom: 18 }}>
        <Col span={6}>
          <Input
            placeholder='Tìm theo tên hoặc mã...'
            prefix={<SearchOutlined />}
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>

        <Col span={3}>
          <Select
            placeholder='Trạng thái'
            style={{ width: '100%' }}
            allowClear
            onChange={(e) => setFilterStatus(e)}
            options={[
              { label: 'Tuyển sinh', value: 'OPEN' },
              { label: 'Đang hoạt động', value: 'RUNNING' },
              { label: 'Đã đóng', value: 'CLOSED' },
            ]}
          >
          </Select>
        </Col>
        <Col style={{ marginLeft: 'auto' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
          //onClick={handleModalAdd}
          >
            Thêm lớp học
          </Button>
        </Col>
      </Row>
      {/* Bảng hiển thị dữ liệu */}
      <Table <ClassDB>
        dataSource={filteredData}
        columns={ClassColumn(false)}
        loading={loading}
        // rowClassName={
        // 	(record) => {
        // 		return lophoc.ID === courseId ? 'highlight-row' : ''
        // 	}
        // }
        pagination={{ defaultPageSize: 8 }}
        rowKey="ID"
        scroll={{ x: 1000, y: 430 }}
      />

      {/* Hiển thị Modal UI */}
      {/* <CourseModal
				open={isOpen}
				onCancel={() => { setIsOpen(false); setEditingCourse(null) }}
				onSave={handleSaveModal}
				editingCourse={editingCourse!}
			/> */}
    </Card>
  )
}

export default ClassList