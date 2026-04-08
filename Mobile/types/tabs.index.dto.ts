interface StudentDashboard {
  ID: number
  HocVien: string
  BuoiHocKe: BuoiHocKe
  KetQuaGanNhat: KetQuaGanNhat[]
  HoaDon: HoaDon
}

interface BuoiHocKe {
  BuoiSo: number
  ChuDe: string
  PhongHoc: string
  NgayHoc: string
  GioHoc: string
  Lop: string
  GiaoVien: string
}

interface KetQuaGanNhat {
  BuoiSo: number
  NgayHoc: string
  ChuDe: string
  LopHoc: string
  TongSoBuoi: number
  NhanXetCon: string | null
  DiemDanh: boolean
  Diem: number
}

interface HoaDon {
  SoHDChuaTra: number
  ThoiHan: string // ISO date string
}

export default StudentDashboard