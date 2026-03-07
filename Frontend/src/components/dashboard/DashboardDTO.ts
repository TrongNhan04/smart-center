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

export interface ClassNotis {
    LopHocID: number,
    TenLop: string,
    Loai: string,
    LoiNhan: string
}

export interface RequestNotis {
    BuoiSo: number,
    LopHocID: number,
    TenLop: string,
    GiaoVien: string,
    LyDo: string,
    Ngay: string
}

export type UnsubmitNotis = Omit<RequestNotis,'LyDo'>