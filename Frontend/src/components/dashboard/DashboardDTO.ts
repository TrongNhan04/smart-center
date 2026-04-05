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

export interface TaskDB {
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
    TenLop: string,
    BuoiSo: number,
    NgayHoc: string,
    GioHoc: string,
    PhongHoc: string,
    TongGhiDanh: number
}