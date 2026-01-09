import { IsOptional } from "class-validator";

export class QueryInvoiceDTO{
    @IsOptional()
    q?:string
}