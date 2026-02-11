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
    GiaoVien:{
        ID: number,
        HoTen:string
    },
    KhoaHoc:{
        ID: number,
        TenKhoaHoc: string
    }
    TuNgay:string,
    DenNgay: string,
    LichHoc: number[],
    GioHoc: string,
    SiSo: number,
    TongGhiDanh: number,
    TrangThai: string,
    PhongHoc?: string 
}

//     ID: number, 
//     MaLopHoc: string, 
//     TenLop:string, 
//     GiaoVienID: number,4
//     KhoaHocID: number 5
//     TuNgay:string, 6
//     DenNgay: string, 6
//     LichHoc: number[], 7
//     GioHoc: string,7
//     SiSo: number,8
//     TongGhiDanh: number,8
//     TrangThai: string,9