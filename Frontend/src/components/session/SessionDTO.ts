// form
export interface SessionDto {
    topic?: string
    date: string
    startAt: string
    endAt: string
    description?: string
    room?: string
}

// list cho trang chi tiết lớp học / giáo viên
export interface SessionDB {
    ID: number,
    LopHocID: number,
    BuoiSo: number,
    ChuDe: string,
    NhanXetChung: string,
    BatDauLuc: string,
    KetThucLuc: string
    GiaoVienID: number
    PhongHoc: string
    TrangThai: string
    AdminMoKhoa: boolean,
    YeuCauMoKhoa: boolean
}

// chi tiết 1 buổi học 
export type TSessionDetail = SessionDB & {
    NoiDungBaiHoc: string,
    BaiTapVeNha: string,
    GiaoVien: string,
    LopHoc: string,
    ChiTietKetQua?: SessionResult[]
}

// danh sách điểm danh
export interface SessionResult {
    GhiDanhID: number,
    MaHocVien: string,
    TenHocVien: string,
    PhuHuynh: string,
    DienThoai: string,
    DiemDanh: boolean,
    NhanXetRieng: string
    Diem: number
}