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

//  SELECT pt."ID", "MaPhieuThu" AS MaPhieu, "HoaDonID", "SoTien", 
//                 "NgayThu" AS Ngay, "PhuongThuc", pt."GhiChu", 
//                 'RECEIPT' AS Loai, nd."HoTen" as ThuNgan, hv."TenHocVien"
export interface GiaoDich {
    ID: number
    MaPhieu: string,
    HoaDonID: number,
    loai: string
    SoTien: number,
    ngay: string,
    PhuongThuc: string,
    ThuNgan: string,
    TenHocVien: string,
    GhiChu: string
}