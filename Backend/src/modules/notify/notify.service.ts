import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "src/generated/prisma/client";
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
                UserID: payload.userId,
                TieuDe: payload.title,
                NoiDung: payload.body,
                Loai: payload.type,
                DuLieu: payload.data ?? {},
                CreatedAt: new Date()
            }
        })
    }

    // tạo NHIỀU thông báo cùng lúc tx?
    async CreateManyNotis(listParentID: number[], session: any) {
        const notionData = listParentID.map(id => ({
            UserID: id,
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
                where: { UserID: userId },
                orderBy: { CreatedAt: 'desc' },// lấy tin mới nhất
                take: take,
                skip: skip
            }),
            // tổng số lượng thông báo
            this.prisma.thongBao.count({ where: { UserID: userId } }),
            // tổng số lượng thông báo chưa đọc
            this.prisma.thongBao.count({ where: { UserID: userId, DaDoc: false } })
        ])
        return { items, total, unReadCount }
    }

    // đánh dấu đã đọc 
    async MaskAsRead(userId: number, notifyId: number) {
        await this.NotifyValidator(userId, notifyId)
        return await this.prisma.thongBao.update({
            where: {
                UserID: userId, ID: notifyId
            },
            data: { DaDoc: true }
        })
    }

    // đánh dấu đọc tất cả
    async MaskAllRead(userId: number) {
        await this.prisma.thongBao.updateMany({
            where: {
                UserID: userId, DaDoc: false
            },
            data: { DaDoc: true }
        })
        return { msg: "successful" }
    }

    // thông báo hủy buổi học tx?
    async SSCancelledNotify(userId: number[], session: any, reason: string) {
        const title = "Thông báo hủy buổi học"
        const dateStr = session.BatDauLuc.toLocaleDateString('vi-VN')
        const body = `Lớp ${session.lophoc.MaLopHoc} - Buổi ngày ${dateStr} đã bị hủy. Lý do: ${reason}`

        const notisData = userId.map(id => ({
            UserID: id,
            TieuDe: title,
            NoiDung: body,
            Loai: "SESSION_CANCEL",
            DuLieu: {
                sessionId: session.ID,
                classId: session.LopHocID
            },
            DaDoc: false,
        }))

        if (notisData.length > 0)
            return this.prisma.thongBao.createMany({ data: notisData })
    }

    // thông báo học phí có tx
    async InvoiceNotify(userId: number, invoice: any, tx?: Prisma.TransactionClient) {
        let client: Prisma.TransactionClient | null = null
        if (tx) client = tx
        else client = this.prisma
        const dateStr = invoice.ThoiHan.toLocaleDateString('vi-VN')

        return await client.thongBao.create({
            data: {
                UserID: userId,
                TieuDe: 'Thông báo học phí',
                NoiDung: `Học phí lớp ${invoice.TenLop}: ${invoice.TongTien}. Hạn thanh toán là ${dateStr}.`,
                Loai: 'INVOICE',
                DuLieu: {
                    invoiceId: invoice.ID,
                    studentId: invoice.HocVienID,
                    classId: invoice.LopHocID
                },
                DaDoc: false,
            }
        })
    }

    // thông báo đã thu tiền có tx
    async PaymentNotify(userId: number, receipt: any,
        tx?: Prisma.TransactionClient) {
        let client: Prisma.TransactionClient | null = null
        if (tx) client = tx
        else client = this.prisma
        // userId, title, body, tpye, data, isRead
        return await client.thongBao.create({
            data: {
                UserID: userId,
                TieuDe: 'Thanh toán học phí thành công',
                NoiDung: `Đã ghi nhận thanh toán học phí, số tiền là ${receipt.SoTien}. Vui lòng kiểm tra lịch sử thanh toán trong ứng dụng.`,
                Loai: 'RECEIPT',
                DuLieu: {
                    receiptId: receipt.ID,
                    invoiceId: receipt.HoaDonID
                }
            }
        })
    }

    // thông báo mở khóa buổi học tx?
    async UnLockSSNotify(userId: number, session: any) {
        const dateStr = session.BatDauLuc.toLocaleDateString('vi-VN')
        return await this.prisma.thongBao.create({
            data: {
                UserID: userId,
                TieuDe: "Thông báo hệ thống",
                NoiDung: `Đã mở khóa buổi học ngày ${dateStr} của lớp ${session.lophoc.TenLop}. Vui lòng kiểm tra lại buổi học`,
                Loai: 'SYSTERM_ARLERT',
                DuLieu: {
                    sessionId: session.ID
                },
                DaDoc: false
            }
        })
    }

    // kiểm tra id thông báo
    private async NotifyValidator(userId: number, notifyId: number) {
        const notis = await this.prisma.thongBao.findUnique({
            where: { ID: notifyId }
        })
        if (!notis) throw new NotFoundException('Notis not found')

        if (notis.UserID !== userId)
            throw new ForbiddenException('Access denied')
        return notis
    }
}