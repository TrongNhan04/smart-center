// cho modal, form gửi backend   
export interface CourseDto { 
  id?: number
  code: string,
  name: string,
  level: string,
  duration: number,
  courseFee: number,
  totalSession: number,
  description?: string|null
}

// cho table hiển thị
export interface CourseDB {
  ID: number,
  MaKhoaHoc: string,
  TenKhoaHoc: string,
  TrinhDo: string,
  HocPhi: number,
  ThoiGian: number,
  TongSoBuoi: number,
  TrangThai: string,
  MoTa?: string,
}

// để cho edit
export const mapDataCourse = (record: CourseDB): CourseDto => {
  return {
    id: record.ID,
    code: record.MaKhoaHoc,
    name: record.TenKhoaHoc,
    level: record.TrinhDo,
    courseFee: Number(record.HocPhi),
    duration: record.ThoiGian,
    totalSession: record.TongSoBuoi,
    description: record.MoTa
  }
}
