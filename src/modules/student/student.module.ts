import { Module } from "@nestjs/common";
import { StudentController } from "./student.controller";
import { StudentService } from "./student.service";
import { EnrollModule } from "../enroll/enroll.module";
import { InvoiceModule } from "../invoice/invoice.module";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
    imports:[EnrollModule, InvoiceModule, PrismaModule],
    controllers: [StudentController],
    providers: [StudentService]
})
export class StudentModule { }