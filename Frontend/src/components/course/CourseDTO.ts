// cho modal, form gửi backend   
export interface CourseDto {
  id?: number
  code: string,
  name: string,
  level: string,
  duration: number,
  courseFee: number,
  totalSession: number,
  syllabus?: string
  description?: string | null
}

export interface Syllabus {
  ThuTu: number,
  ChuDe: string
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
  decuong: Syllabus[] // include với course nên chữ thường
  MoTa?: string,
}

export type CourseForCmb = Pick<CourseDB,
  'ID' | 'MaKhoaHoc' | 'TenKhoaHoc' | 'HocPhi' | 'ThoiGian'>

// từ table tiếng việt thành form tiếng anh
export const mapDataCourse = (record: CourseDB): CourseDto => {
  let deCuongDB = ''
  if (record.decuong.length)
    deCuongDB = record.decuong.map
      (item => item.ThuTu + ' ' + item.ChuDe).join('\n')
  return {
    // id: record.ID, không cần id vì form ko có id
    code: record.MaKhoaHoc,
    name: record.TenKhoaHoc,
    level: record.TrinhDo,
    courseFee: Number(record.HocPhi),
    duration: record.ThoiGian,
    totalSession: record.TongSoBuoi,
    description: record.MoTa,
    syllabus: deCuongDB
  }
}
