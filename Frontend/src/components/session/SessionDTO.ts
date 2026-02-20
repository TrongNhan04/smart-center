export interface SessionDto{
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