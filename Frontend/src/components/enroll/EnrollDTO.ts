export interface EnrollDto {
    id?: number,
    studentId: number,
    classId: number,
    fee: number
}

export interface EnrollDB {
    ID: number,
    LopHocID: number,
    TenLop: string,
    HocVienID: number,
    MaHocVien: string,
    TenHocVien: string,
    NgayGhiDanh: string,
    GhiChu: string,
    TrangThai: string
}