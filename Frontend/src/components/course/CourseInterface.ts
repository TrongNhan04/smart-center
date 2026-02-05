export interface CreateCourse {
  code: string,
  name: string,
  level: string,
  duration: number,
  courseFee: number,
  totalSession: number,
  description: string
}

export interface CourseType {
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