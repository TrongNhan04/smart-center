import { Type } from "class-transformer"
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator"

export class ResultDetailDTO {
    @IsNotEmpty()
    @IsNumber()
    GhiDanhID: number

    @IsOptional()
    @IsString()
    NhanXetRieng?: string

    @IsBoolean()
    DiemDanh: boolean

    @IsOptional()
    @IsNumber()
    @Min(0) @Max(10)
    Diem?: number
}

//đinh nghĩa lớp cha
export class SessionsResultDTO{
    @IsString()
    NhanXetChung:string

    @IsOptional()
    TepDinhKem:string[]

    @IsArray()
    @ValidateNested({each:true})
    @Type(()=>ResultDetailDTO)
    ChiTietKetQua: ResultDetailDTO[]
}

export class RequestUnlock{
    @IsNotEmpty()
    @IsString()
    reason:string
}