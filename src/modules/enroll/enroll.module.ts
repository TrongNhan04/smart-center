import { Module } from "@nestjs/common";
import { EnrollService } from "./enroll.service";
import { EnrollController } from "./enroll.controller";
import { InvoiceModule } from "../invoice/invoice.module";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
    imports:[InvoiceModule, PrismaModule],
    controllers:[EnrollController],
    providers:[EnrollService],
    exports:[EnrollService]
})
export class EnrollModule{}