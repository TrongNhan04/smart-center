// cho tab lớp
export interface ClassOfStu {
    ID: number,
    MaLop: string,
    TenLop: string,
    GiaoVien: string,
    LichHoc: number[],
    GioHoc: string,
    BuoiHocDuocChon: number,
    SoBuoiDaHoc: number,
    TongSoBuoi: number,
    CoMat: number,
    Vang: number
}

export interface SessionOfStu {
    TenLop: string,
    GiaoVien: string,
    BuoiHocID: number,
    NgayHoc: string,
    GioHoc: string,
    DiemDanh: boolean,
    DiemSo?: string,
    BaiHoc: string,
    NoiDung: string,
    BaiTap: string,
    NhanXet: string,
    TepDinhKem: TepDinhKem[]
}

interface TepDinhKem {
    ID:number,
    URL: string,
    LoaiTep:string
}

export interface SessionIds{
    ID: number,
    BuoiSo: number
}