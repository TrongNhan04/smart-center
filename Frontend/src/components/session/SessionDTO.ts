// form
export interface SessionDto {
    topic?: string
    date: string
    startAt: string
    endAt: string
    description?: string
    room?: string
}

// list
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

// drawer
export interface SessionDetail {
    ID: number
    BuoiSo: number,
    ChuDe: string,
    BatDauLuc: string,
    KetThucLuc: string,
    PhongHoc: string,
    LopHoc: string,
    GiaoVien: string,
    TrangThai: string,
    KetQua: SessionResult[]
}

// drawer
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

export interface SS_StudentDetail {
    ID: number, // id kết quả chi tiết
    BuoiSo: number,
    ChuDe: string,
    BatDauLuc: string,
    KetThucLuc: string,
    PhongHoc: string,
    LopHocID: number,
    GiaoVienID: number,
    TenGiaoVien: string,
    NhanXet: string,
    DiemDanh: boolean,
    Diem: number
}