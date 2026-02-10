export interface ClassDto{
    id?:number,
    code: string,
    courseId: number,
    teacherId: number,
    name: string,
    fromDate: Date,
    toDate: Date,
    timeTable: number[],
    startTime: string,
    endTime: string,
    classSize: number
}

export interface ClassDB{
    ID: number,
    MaLopHoc: string,
    TenLop:string,
    GiaoVien: string,
    TuNgay:string,
    DenNgay: string,
    LichHoc: number[],
    GioHoc: string,
    SiSo: number,
    TongGhiDanh: number,
    TrangThai: string,
    PhongHoc?: string 
}