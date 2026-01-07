import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma, PrismaClient } from "src/generated/prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class EnrollService {
    constructor(
        private prismaService: PrismaService) { }

    async EnrollValidator(enrollId: number) {
        const enrollDB = await this.prismaService.ghiDanh.findUnique({
            where: { ID: enrollId, TrangThai: 'ACTIVE' }
        })
        if (!enrollDB) throw new BadRequestException('Enroll is not existed')
    }

    async CreateEnroll(studentId: number, classId: number, tx: Prisma.TransactionClient) {
        const today = new Date()
        let client: Prisma.TransactionClient | null = null
        if (tx) client = tx
        else client = this.prismaService
        return await client.ghiDanh.create({
            data: {
                LopHocID: classId,
                HocVienID: studentId,
                NgayGhiDanh: today
            },
            omit: { UpdatedAt: true, CreatedAt: true }
        })
    }
}