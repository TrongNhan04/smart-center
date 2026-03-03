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

export interface ReceiptDB {
    ID: number,
    MaPhieuThu: string,
    NgayThu: string,
    SoTien: number,
    PhuongThuc: string,
    ThuNgan: string,
    GhiChu: string
}

export interface PaymentDB {
    ID: number,
    MaPhieuChi: string,
    NgayChi: string,
    SoTien: number,
    PhuongThuc: string,
    ThuNgan: string,
    LyDo: string
}