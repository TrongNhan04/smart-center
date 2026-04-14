export interface Summaries {
    TongHocVien: number,
    GhiDanhMoi: number,
    LoiNhuan: number,
    HoaDonQuaHan: number,
    TongNoQuaHan: number
}

export interface ReveueChart {
    LopHocID: number,
    MaLopHoc: string,
    TenLop: string,
    DoanhThu: number
}

export interface EnrollChart {
    Thang: string,
    GhiDanhMoi: number
}

// thông báo cho admin
export interface AdminNotis {
    BuoiHocID: number,
    BuoiSo: number,
    LopHocID: number,
    TenLop: string,
    GiaoVienID: number,
    GiaoVien: string,
    LoiNhan: string,
    Ngay: string,
    Loai: string
}

export interface ReminderTeacher {
    classId: number,
    ssNumber: number
}

// dto cho trang thời khóa biểu
export interface ClassSchedule {
    ID: number, // id buổi học
    LopHocID: number,
    TenLop: string,
    BuoiSo: number,
    NgayHoc: string,
    GioHoc: string,
    PhongHoc: string,
    TongGhiDanh: number
}

// thông báo cho giáo viên
export interface TeacherNotis {
    ID: number,
    TieuDe: string,
    NoiDung: string,
    Loai: string
    DuLieu: JSON
    DaDoc: boolean
    ThoiGian:string
}