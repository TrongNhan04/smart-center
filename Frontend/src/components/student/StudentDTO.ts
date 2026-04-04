export interface StudentDto {
    id?: number,
    code: string,
    classId: number,
    student: string,
    parent: string,
    email: string,
    phone: string,
    dob: string,
    address?: string
    fee?: number
}

export interface StudentDB {
    ID: number,
    MaHocVien: string,
    TenHocVien: string,
    NgaySinh: string,
    DiaChi: string
    PhuHuynh: string,
    DienThoai: string,
    Email: string,
    TrangThai: string
}

export interface StudentForCmb {
    ID: number,
    MaHocVien: string,
    TenHocVien: string
}

export const mapDataStudent = (record: StudentDB):
    Omit<StudentDto, 'classId' | 'fee'> => ({
        // id: record.ID,
        code: record.MaHocVien,
        student: record.TenHocVien,
        parent: record.PhuHuynh,
        email: record.Email,
        phone: record.DienThoai,
        dob: record.NgaySinh,
        address: record.DiaChi
    })

export interface ClassForStudent {
    ID: number,
    MaLopHoc:string,
    TenLop: string,
    GiaoVien: string,
    LichHoc: number[],
    TuNgay: string,
    DenNgay: string,
    GioHoc: string,
    TongSoBuoi: number,
    BuoiDaHoc: number,
    NgayGhiDanh: string
    TrangThaiGD: string
}

//thống kê kết quả học tập 1 lớp mà học viên học
export interface ClassResult {
    LopHoc: string,
    GiaoVien: string,
    HocVien: string,
    GioHoc: string,
    PhongHoc:string,
    KetQua: Result[]
}

export interface Result {
    ID: number, // id kết quả chi tiết
    BuoiSo: number,
    ChuDe?: string,
    BatDauLuc: string,
    NhanXet: string,
    DiemDanh: boolean,
    Diem?: number
}