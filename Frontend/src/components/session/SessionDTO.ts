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
    BatDauLuc: string,
    KetThucLuc: string
    GiaoVienID: number
    PhongHoc: string
    TrangThai: string
    AdminMoKhoa: boolean,
    YeuCauMoKhoa: boolean
}

// chi tiết 1 buổi học cho drawer
export type SessionDetail =
    Omit<SessionDB, 'AdminMoKhoa' | 'YeuCauMoKhoa'> & {
        GiaoVien: string,
        LopHoc: string,
        KetQua: SessionResult[]
    }

// drawer danh sách điểm danh
export interface SessionResult {
    HocVienID: number,
    MaHocVien: string,
    TenHocVien: string,
    PhuHuynh: string,
    DienThoai: string,
    Email: string
    DiemDanh: boolean,
    NhanXet: string
    Diem: number
}

// kết quả các buổi học viên đã học
export type SS_StudentDetail =
    Omit<SessionDB, 'AdminMoKhoa' | 'YeuCauMoKhoa'> &
    {
        TenGiaoVien: string,
        NhanXet: string,
        DiemDanh: boolean,
        Diem: number
    }

// type cho lịch dạy của giáo viên
export interface ScheduleOW {
    ID: number, // id buổi học
    NgayHoc: string,
    GioHoc: string,
    LopHocID: number,
    TenLop: string,
    PhongHoc: string,
    TrangThai: string
}