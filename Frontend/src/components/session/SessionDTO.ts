export interface SessionDto {
    topic?: string
    date: string
    startAt: string
    endAt: string
    description?: string
    room?: string
}

export interface SessionDB {
    ID: number,
    LopHocID: number,
    BuoiSo: number,
    ChuDe: string,
    BatDauLuc: string,
    KetThucLuc: string
    MoTa: string,
    PhongHoc: string
    TrangThai: string
    AdminMoKhoa: boolean,
    YeuCauMoKhoa: boolean
}

export interface SessionDetail {
    ID: number
    BuoiSo: number,
    ChuDe: string,
    BatDauLuc: string,
    KetThucLuc: string,
    PhongHoc: string,
    LopHoc: string,
    GiaoVien: string,
    TrangThai:string,
    KetQua: SessionResult[]
}

export interface SessionResult {
    HocVienID:number,
    MaHocVien: string,
    TenHocVien: string,
    PhuHuynh: string,
    DienThoai: string,
    Email:string
    DiemDanh: boolean,
    NhanXet: string
    Diem: number
}