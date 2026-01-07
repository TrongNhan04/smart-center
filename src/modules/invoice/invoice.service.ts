import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { EnrollService } from "../enroll/enroll.service";
import { CourseService } from "../course/course.service";
import { ClassService } from "../class/class.service";
import { Prisma } from "src/generated/prisma/client";

@Injectable()
export class InvoiceService {
    constructor(
        private prismaService: PrismaService,
        private enrollService: EnrollService,
        // private courseService: CourseService,
        // private classService: ClassService
    ) { }

    async CreateInvoice(enrollId: number, dueDate: Date, toTal: number, tx: Prisma.TransactionClient) {
        // await this.enrollService.EnrollValidator(enrollId)
        const count = await this.prismaService.hoaDon.count()
        const code = "HD" + count
        let client: Prisma.TransactionClient | null = null
        if(tx) client = tx
        else client = this.prismaService
        return await client.hoaDon.create({
            data: {
                MaHoaDon: code,
                ThoiHan: dueDate, 
                TongTien: toTal,
                GhiDanhID: enrollId
            }
        })
    }
}