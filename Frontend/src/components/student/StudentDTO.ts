export interface StudentDto {
    id?: number,
    code: string,//
    classId: number,//
    student: string,//
    parent: string,
    email: string,
    phone: string,
    dob: string,
    address?: string//
    fee: number // học phí
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

export const mapDataStudent = (record: StudentDB):
    Omit<StudentDto, 'classId' | 'fee'> => ({
        id: record.ID,
        code: record.MaHocVien,
        student: record.TenHocVien,
        parent: record.PhuHuynh,
        email: record.Email,
        phone: record.DienThoai,
        dob: record.NgaySinh,
        address: record.DiaChi
    })