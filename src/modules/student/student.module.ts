import { Module } from "@nestjs/common";
import { StudentController } from "./student.controller";
import { StudentService } from "./student.service";
import { PrismaService } from "src/prisma/prisma.service";
import { CourseService } from "../course/course.service";
import { ClassService } from "../class/class.service";
import { InvoiceService } from "../invoice/invoice.service";
import { EnrollService } from "../enroll/enroll.service";

@Module({
    // imports:[CourseModule, ClassModule],
    controllers:[StudentController],
    providers:[StudentService, PrismaService, CourseService,
        ClassService, InvoiceService, EnrollService
    ]
})
export class StudentModule{}