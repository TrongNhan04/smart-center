import { Type } from "class-transformer"
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator"

export class ResultDetailDTO {
    @IsNotEmpty()
    @IsNumber()
    enrollmentId: number

    @IsOptional()
    @IsString()
    privateComment?: string

    @IsBoolean()
    isAttend: boolean

    @IsOptional()
    @IsNumber()
    @Min(0) @Max(10)
    score?: number
}

//đinh nghĩa lớp cha
export class SessionsResultDTO{
    @IsString()
    comment:string

    @IsArray()
    @ValidateNested({each:true})
    @Type(()=>ResultDetailDTO)
    details: ResultDetailDTO[]
}