export interface SessionDto{
    classId: number
    topic?: string
    date: Date
    startAt: string
    endAt: string
    description?: string
    room?: string
}

export interface SessionDB {
    ID: string,
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