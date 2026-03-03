export interface TeacherDto {
    id?: number,
    code: string,
    name: string,
    phone: string,
    email: string,
    major?: string
}

export interface TeacherDB {
    ID: number,
    MaGiaoVien: string,
    HoTen: string,
    DienThoai: string,
    Email: string
    ChuyenMon: string,
    TrangThai: string
    SoBuoiDaDay: number
}

export type TeacherForCmb = Pick<TeacherDB,'ID'|'HoTen'|'MaGiaoVien'>

export const mapDataTeacher = (value: TeacherDB): TeacherDto => ({
    // id: value.ID,
    code: value.MaGiaoVien,
    name: value.HoTen,
    phone: value.DienThoai,
    email: value.Email,
    major: value.ChuyenMon
})