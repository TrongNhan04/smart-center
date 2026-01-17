import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class NotifyService {
    constructor(private prisma: PrismaService) { }

    // tạo 1 thông báo 
    async CreateNotifycation(payload: {
        userId: number, title: string,
        body: string, type: string, data?: any
    }) {
        return await this.prisma.thongBao.create({
            data: {
                UserId: payload.userId,
                TieuDe: payload.title,
                NoiDung: payload.body,
                Loai: payload.type,
                DuLieu: payload.data ?? {},
                CreatedAt: new Date()
            }
        })
    }

    // tạo NHIỀU thông báo cùng lúc
    async CreateManyNotis(listParentID:number[], session:any) {
        const notionData = listParentID.map(id => ({
            UserId: id,
            TieuDe: 'Kết quả học tập mới',
            NoiDung: `Kết quả buổi học ngày ${session.BatDauLuc.toLocaleDateString()}`,
            Loai: 'SESSION_RESULT',
            DuLieu: {
                sessionId: session.ID,
                classId: session.LopHocID
            },
            DaDoc: false,
            CreatedAt: new Date()
        }))
        return await this.prisma.thongBao.createMany({ data: notionData })
    }

    // lấy danh sách
    async GetMyNotification(userId: number, page: number = 1) {
        const take = 20 // lấy bao nhiêu
        const skip = (page - 1) * take // bỏ bao nhiêu

        const [items, total, unReadCount] = await this.prisma.$transaction([
            // lấy danh sách thông báo theo phân trang
            this.prisma.thongBao.findMany({
                where: { UserId: userId },
                orderBy: { CreatedAt: 'desc' },// lấy tin mới nhất
                take: take,
                skip: skip
            }),
            // tổng số lượng thông báo
            this.prisma.thongBao.count({ where: { UserId: userId } }),
            // tổng số lượng thông báo chưa đọc
            this.prisma.thongBao.count({ where: { UserId: userId, DaDoc: false } })
        ])
        return { items, total, unReadCount }
    }

    // đánh dấu đã đọc 
    async MaskAsRead(userId: number, notifyId: number) {
        await this.NotifyValidator(userId, notifyId)
        return await this.prisma.thongBao.update({
            where: {
                UserId: userId, ID: notifyId
            },
            data: { DaDoc: true }
        })
    }

    // đánh dấu đọc tất cả
    async MaskAllRead(userId: number) {
        await this.prisma.thongBao.updateMany({
            where: {
                UserId: userId, DaDoc: false
            },
            data: { DaDoc: true }
        })
        return { msg: "successful" }
    }

    // kiểm tra id thông báo
    private async NotifyValidator(userId: number, notifyId: number) {
        const notis = await this.prisma.thongBao.findUnique({
            where: { ID: notifyId }
        })
        if (!notis) throw new NotFoundException('Notis not found')

        if (notis.UserId !== userId)
            throw new ForbiddenException('Access denied')
        return notis
    }
}