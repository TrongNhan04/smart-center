export interface InvoiceDB {
    ID: number,
    MaHoaDon: string,
    HocVienID: number,
    TenHocVien: string,
    TenLop?: string
    DienThoai: string
    TongTien: number,
    DaTra: number,
    NgayPhatHanh: string,
    NgayHetHan: string
    TrangThai: string
}

export interface ReceiptDto {
    amount: number,
    method: string,
    note: string
}

export interface PaymentDto {
    amount: number,
    method: string,
    reason: string
}

export interface GiaoDich {
    ID: number
    MaGiaoDich: string,
    HoaDonID: number,
    LoaiGiaoDich: string
    SoTien: number,
    NgayGiaoDich: string,
    PhuongThuc: string,
    ThuNgan: string,
    TenHocVien: string,
    GhiChu: string
}