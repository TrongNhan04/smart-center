import { Breadcrumb, Button, Card, Descriptions, message, Table } from "antd"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import type { CourseDB } from "./CourseInterface"
import type { ClassDB } from "../class/ClassInterface"
import courseApi from "../../api/courseApi"
import classApi from "../../api/classApi"

const CourseDetail = () => {
  const { id } = useParams()
  const [course, setCourse] = useState<any>(null)
  const [classes, setClasses] = useState<any>(null)

  const fetchData = async () => {
    try {
      const courseId = Number(id)
      const [courseRes, classesRes] = await Promise.all([
        await courseApi.findOne(courseId),
        await classApi.getClassesOfCourse(courseId)
      ])
      setCourse(courseRes.data)
      setClasses(classesRes.data)
      console.log("course của useState: ", course)
    }
    catch (error: any) {
      message.error('Lỗi tải dữ liệu')
      console.log(error.response.data.message)
    }
  }

  useEffect(()=>{
    fetchData()
  },[id])

  if(!course) return<div>Không tìm thấy khóa học</div>

  const columns = [
    {
      title:'ID', dataIndex:'ID', key: 'ID'
    },
    {
      title:'Mã lớp học', dataIndex:'MaLopHoc', key: 'MaLopHoc'
    },
    {
      title:'Tên lớp học', dataIndex:'TenLop', key: 'TenLop'
    },
    {
      title:'Giáo viên', dataIndex:'GiaoVien', key: 'GiaoVien'
    },
    {
      title:'Ngày khai giảng', dataIndex:'TuNgay', key: 'TuNgay'
    },
    {
      title:'Lịch học', dataIndex:'LichHoc', key: 'LichHoc'
    },
    {
      title:'Sĩ số', dataIndex:'SiSo', key: 'SiSo'
    },
    {
      title:'Trạng thái', dataIndex:'TrangThai', key: 'TrangThai'
    },
  ]

  return (
    <>
      {/* Thanh bánh mì để quay lại */}
      <Breadcrumb style={{ marginBottom: 16 }}
        items={[
          { href: '/admin/courses', title: 'Danh sách khóa học' },
          { title: `${id}` }
        ]}
      >
      </Breadcrumb>

      {/* Phần trên - thông tin chi tiết khóa học */}
      <Card
        title="Thông tin khóa học" variant="borderless"
        extra={<Button type="primary">Sửa thông tin</Button>}
      >
        <Descriptions
          items={[
            { label: 'Mã khóa học', children: `${course.MaKhoaHoc}` },
            { label: 'Tên khóa học', children: `${course.TenKhoaHoc}` },
            { label: 'Trình độ', children: `${course.TrinhDo}` },
            { label: 'Học phí', children: `${course.HocPhi}` },
            { label: 'Thời gian', children: `${course.ThoiGian}` },
            { label: 'Tổng số buổi', children: `${course.TongSoBuoi}` },
            { label: 'Trạng thái', children: `${course.TrangThai}` },
            { label: 'Mô tả', children: `${course.MoTa??"Chưa cập nhật"}` },
          ]}
        >
        </Descriptions>
      </Card>

      {/* Phần dưới danh sách lớp thuộc khóa học */}
      <Card
        title={`Danh sách lớp học (${classes.length})`}
        style={{ marginTop: 24 }}
        type="inner"
        extra={<Button type="dashed" size="small">+ Mở lớp cho khóa học này</Button>}
      >
        <Table
        dataSource={classes}
        columns={columns}
        rowKey="ID"
        />
      </Card>
    </>
  )
}

export default CourseDetail

// ID, MaLopHoc, KhoaHocID, TenLop, PhongHoc, MoTa, GiaoVienID,
// TuNgay, DenNgay, LichHoc, GioBatDau, GioKetThuc,
// SiSo, TrangThai, CreatedAt, UpdatedAt. 