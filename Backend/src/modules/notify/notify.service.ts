import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "src/generated/prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class NotifyService {
    constructor(private prismaSv: PrismaService) { }

    // tạo NHIỀU thông báo cùng lúc có tx?
    async createMany(listParentID: number[], session: any,
        tx?: Prisma.TransactionClient) {

        let client: Prisma.TransactionClient | null = null
        if (tx) client = tx
        else client = this.prismaSv
        const dateStr = session.BatDauLuc.toLocaleDateString()
        const notionData = listParentID.map(id => ({
            UserID: id,
            TieuDe: 'Kết quả học tập mới',
            NoiDung: `Kết quả buổi học số ${session.BuoiSo} ngày ${dateStr} - Lớp học: ${session.LopHoc}`,
            Loai: 'SESSION_RESULT',
            DuLieu: {
                sessionId: session.ID,
                classId: session.LopHocID
            }
        }))
        return await client.thongBao.createMany({ data: notionData })
    }

    // lấy danh sách
    async getManyByUserId(userId: number, page: number = 1) {
        // const take = 10 // lấy bao nhiêu
        // const skip = (page - 1) * take // bỏ bao nhiêu
        const [items, total, unReadCount] = await this.prismaSv.$transaction([
            // lấy danh sách thông báo theo phân trang
            this.prismaSv.thongBao.findMany({
                where: { UserID: userId },
                orderBy: { CreatedAt: 'desc' },// lấy tin mới nhất
                omit: { UserID: true, UpdatedAt: true },
                // take: take,
                // skip: skip
            }),
            // tổng số lượng thông báo
            this.prismaSv.thongBao.count({ where: { UserID: userId } }),
            // tổng số lượng thông báo chưa đọc
            this.prismaSv.thongBao.count({ where: { UserID: userId, DaDoc: false } })
        ])
        return {
            items: items.map(i => ({ ...i, ThoiGian: i.CreatedAt })),
            total, unReadCount
        }
    }

    // đánh dấu đã đọc 
    async readOne(userId: number, notifyId: number) {
        const { UserID, ID } = await this.notifyIdValidator(userId, notifyId)
        return await this.prismaSv.thongBao.update({
            where: {
                UserID: UserID, ID: ID
            },
            data: { DaDoc: true }
        })
    }

    // đánh dấu đọc tất cả
    async readAll(userId: number) {
        return await this.prismaSv.thongBao.updateMany({
            where: {
                UserID: userId, DaDoc: false
            },
            data: { DaDoc: true }
        })
    }

    // thông báo hủy buổi học có tx
    async createCancelSessionNotify(userId: number[], session: any, reason: string) {
        const title = "Thông báo hủy buổi học"
        const dateStr = session.BatDauLuc.toLocaleDateString('vi-VN')
        const body = `Lớp '${session.lophoc.TenLop}' - buổi ${session.BuoiSo} (${dateStr}) đã hủy vì: ${reason}`

        const notisData = userId.map(id => ({
            UserID: id,
            TieuDe: title,
            NoiDung: body,
            Loai: "SESSION_CANCEL",
            DuLieu: {
                sessionId: session.ID,
                classId: session.LopHocID
            }
        }))

        if (notisData.length > 0)
            return await this.prismaSv.thongBao.createMany({ data: notisData })
    }

    // thông báo học phí
    async createInvoiceNotify(userId: number, payload:any) {
        const {ThoiHan, TenLop, TongTien, HoaDonId, HocVienId, LopHocId} = payload
        const dateStr = ThoiHan.toLocaleDateString('vi-VN')
        return await this.prismaSv.thongBao.create({
            data: {
                UserID: userId,
                TieuDe: 'Thông báo học phí',
                NoiDung: `Học phí lớp ${TenLop}: ${TongTien}. Hạn thanh toán là ${dateStr}.`,
                Loai: 'INVOICE',
                DuLieu: {
                    invoiceId: HoaDonId,
                    studentId: HocVienId,
                    classId: LopHocId
                }
            }
        })
    }

    // thông báo đã thu tiền 
    async createReceiptNotify(userId: number, receipt: any) {
        const amount = Number(receipt.SoTien).toLocaleString()
        return await this.prismaSv.thongBao.create({
            data: {
                UserID: userId,
                TieuDe: 'Thanh toán học phí thành công',
                NoiDung: `Đã ghi nhận thanh toán học phí, số tiền là ${amount}. Vui lòng kiểm tra hóa đơn thanh toán trong ứng dụng.`,
                Loai: 'RECEIPT',
                DuLieu: {
                    receiptId: receipt.ID,
                    invoiceId: receipt.HoaDonID
                }
            }
        })
    }

    // thông báo mở khóa buổi học
    async createUnLockSSNotify(session: any) {
        const dateStr = session.BatDauLuc.toLocaleDateString('vi-VN')
        return await this.prismaSv.thongBao.create({
            data: {
                UserID: session.UserID,
                TieuDe: "Thông báo hệ thống",
                NoiDung: `Đã mở khóa buổi ${session.BuoiSo} (${dateStr}) của lớp '${session.TenLop}'. Vui lòng kiểm tra lại buổi học`,
                Loai: 'SYSTERM_ARLERT',
                DuLieu: {
                    classId: session.LopHocID,
                    sessionId: session.ID
                }
            }
        })
    }

    // kiểm tra id thông báo
    private async notifyIdValidator(userId: number, notifyId: number) {
        const notis = await this.prismaSv.thongBao.findUnique({
            where: { ID: notifyId }
        })
        if (!notis) throw new NotFoundException('Không tìm thấy thông báo')

        if (notis.UserID !== userId)
            throw new ForbiddenException('Truy cập từ chối')
        return notis
    }
}