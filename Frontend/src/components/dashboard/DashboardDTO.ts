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

export interface TaskDB {
    BuoiSo?: number,
    LopHocID: number,
    TenLop: string,
    GiaoVien: string,
    LoiNhan: string,
    Ngay: string,
    Loai: string
}

export const mapDataTask = (item: any, isList: boolean) => {
    let TieuDe
    let MoTa
    let Loai: "error" | "warning" | "info" | "success" | undefined

    switch (item.Loai) {
        case 'REQUEST': // yêu cầu mở khóa
            TieuDe = `Yêu cầu mở khóa: lớp ${item.TenLop}`,
                MoTa = `GV: ${item.GiaoVien} - Lý do: ${item.LoiNhan} (Buổi ${item.BuoiSo})`,
                Loai = 'error'
            break;

        case 'UNSUBMIT': // chưa nộp kết quả
            TieuDe = `Chưa nộp điểm danh: Lớp ${item.TenLop}`,
                MoTa = `GV: ${item.GiaoVien} chưa nộp kết quả ngày ${item.Ngay}.`,
                Loai = 'info'
            break;

        default: // tạo thêm lịch học
            TieuDe = `Bổ sung lịch học: Lớp ${item.TenLop}`,
                MoTa = `${item.LoiNhan}`,
                Loai = 'warning'
            break;
    }
    return {TieuDe, MoTa, Loai}
}