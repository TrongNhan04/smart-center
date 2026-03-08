export interface Summaries {
    TongHocVien: number,
    GhiDanhMoi: number,
    LoiNhuan: number,
    HoaDonQuaHan: number,
    TongNoQuaHan: number
}

export interface FinanceChart {
    Thang: number,
    TongThu: number,
    TongChi: number,
    LoiNhuan: number,
    GhiDanhMoi: number
}

export interface SessionToday {
    ThoiGian: string
    TenLop: string,
    GiaoVien: string,
    PhongHoc: string,
    TrangThai: string
}

export interface TaskDB {
    BuoiHocID:number,
    BuoiSo: number,
    LopHocID: number,
    TenLop: string,
    GiaoVienID: number,
    GiaoVien: string,
    LoiNhan: string,
    Ngay: string,
    Loai: string
}

export interface ReminderTeacher{
    classId: number,
    ssNumber: number
}