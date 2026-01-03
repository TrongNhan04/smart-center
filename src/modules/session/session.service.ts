import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class SessionService {
    constructor(
        private prismaService: PrismaService
    ) { }

    async UpdateSessionById(sessionId: number, topic: string) {
        const sessionDB = await this.prismaService.buoiHoc.findUnique({
            where: { ID: sessionId }
        })
        if (!sessionDB) throw new BadRequestException('Session is not existed')
        return await this.prismaService.buoiHoc.update({
            where: { ID: sessionId }, data: { ChuDe: topic },
            select: {
                BuoiSo: true,
                ChuDe: true
            }
        })
    }

    async CancellSessionById(sessionId: number, reason: string) {
        const sessionDB = await this.prismaService.buoiHoc.findUnique({
            where: { ID: sessionId }
        })
        if (!sessionDB)
            throw new BadRequestException('Session is not existed')
        if(!reason)
            throw new BadRequestException('Reason is missing')
        await this.prismaService.buoiHoc.update({
            where: {
                ID: sessionId,
                TrangThai: 'SCHEDULED'
            },
            data: {
                MoTa: reason,
                TrangThai: 'CANCELLED'
            }
        })

        return {mgs: "ok"}
    }
}