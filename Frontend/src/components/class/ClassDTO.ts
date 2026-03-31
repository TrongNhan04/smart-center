export interface ClassDto {
    id?: number,
    code: string,
    courseId: number,
    teacherId: number,
    name: string,
    fromDate: string,
    toDate: string,
    timeTable: number[],
    startTime: string,
    endTime: string,
    classSize: number
    description?: string
    room?: string
}

export interface ClassDB {
    ID: number,
    MaLopHoc: string,
    TenLop: string,
    GiaoVien: {
        ID: number,
        HoTen: string
    },
    KhoaHoc: {
        ID: number,
        TenKhoaHoc: string
    }
    TuNgay: string,
    DenNgay: string,
    LichHoc: number[],
    GioHoc: string,
    SiSo: number,
    TongGhiDanh: number,
    TrangThai: string,
    PhongHoc?: string
    MoTa?: string
}

export interface ClassForCmb {
    ID: number,
    MaLopHoc: string,
    TenLop: string,
    HocPhi:number
    LichHoc: number[],
    GioHoc: string,
    SiSo: number,
    TongGhiDanh: number
}

export type TeacherClass = Omit<ClassDB,'GiaoVien'|'KhoaHoc'|'MoTa'> & {
    IDBuoiDau:number
    TongSoBuoi:number,
    SoBuoiDaHoc:number
}

// để cho edit
export const mapDataClass = (lophoc: ClassDB): ClassDto => ({
    //id: lophoc.ID,
    code: lophoc.MaLopHoc,
    courseId: lophoc.KhoaHoc.ID,
    teacherId: lophoc.GiaoVien.ID,
    name: lophoc.TenLop,
    fromDate: lophoc.TuNgay,
    toDate: lophoc.DenNgay,
    timeTable: lophoc.LichHoc,
    startTime: lophoc.GioHoc.slice(0, 5),
    endTime: lophoc.GioHoc.slice(8, 13),
    classSize: lophoc.SiSo,
    room: lophoc.PhongHoc,
    description: lophoc.MoTa
})