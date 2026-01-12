import { Module } from "@nestjs/common";
import { EnrollService } from "./enroll.service";
import { EnrollController } from "./enroll.controller";
import { PrismaService } from "src/prisma/prisma.service";
import { InvoiceModule } from "../invoice/invoice.module";

@Module({
    imports:[InvoiceModule],
    controllers:[EnrollController],
    providers:[EnrollService, PrismaService],
    exports:[EnrollService]
})
export class EnrollModule{}