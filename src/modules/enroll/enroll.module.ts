import { Module } from "@nestjs/common";
import { EnrollService } from "./enroll.service";
import { EnrollController } from "./enroll.controller";
import { PrismaService } from "src/prisma/prisma.service";
import { ClassService } from "../class/class.service";
import { InvoiceService } from "../invoice/invoice.service";
import { StudentService } from "../student/student.service";

@Module({
    controllers:[EnrollController],
    providers:[EnrollService, PrismaService, 
        ClassService, InvoiceService, StudentService]
})
export class EnrollModule{}