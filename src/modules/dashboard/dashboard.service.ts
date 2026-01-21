import { Injectable } from "@nestjs/common";
import { addMonths, endOfMonth, startOfMonth } from "date-fns";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    // tổng học viên, lớp học, ghi danh mới, tổng thu - chi
    async GetSumary() {
        const now = new Date()
        const start = startOfMonth(now)
        const end = startOfMonth(addMonths(now, 1))
        const [activeStudents, activeClass, newEnrollments
            , receiptThisMonth, paymentThisMonth] = await Promise.all([
                this.prisma.hocVien.count({ where: { TrangThai: 'ACTIVE' } }),
                this.prisma.lopHoc.count({ where: { TrangThai: { not: 'CLOSED' } } }),
                this.prisma.ghiDanh.count({
                    where: {
                        NgayGhiDanh: {
                            gte: start, // bằng hoặc lớn hơn đầu tháng này
                            lt: end // nhỏ hơn đầu tháng sau
                        }
                    }
                }),
                this.prisma.phieuThu.aggregate({
                    _sum: { SoTien: true },
                    where: {
                        NgayThu: {
                            gte: start,
                            lt: end
                        }
                    }
                }),
                this.prisma.phieuChi.aggregate({
                    _sum: { SoTien: true },
                    where: {
                        NgayChi: {
                            gte: start,
                            lt: end
                        }
                    }
                })
            ])
        return {
            activeStudents, activeClass, newEnrollments
            , receiptThisMonth: receiptThisMonth._sum.SoTien,
            paymentThisMonth: paymentThisMonth._sum.SoTien
        }
    }

    // lấy dữ liệu thu - chi theo tháng để vẽ biểu đồ
    async GetChartFinace(year: string) {
        const [receipts, payments] = await Promise.all([
            this.prisma.$queryRaw`
            select date_trunc('month', pt."NgayThu") as "Thang", 
                sum (pt."SoTien") as "TongThu"
            from public."PhieuThu" as pt
            group by "Thang" 
            order by "Thang" asc`,

            this.prisma.$queryRaw`
            select date_trunc('month', pc."NgayChi") as "Thang", 
                sum (pc."SoTien") as "TongChi"
            from public."PhieuChi" as pc
            group by "Thang" `
        ])
        return this.FlattenData(receipts, payments)
    }

    private FlattenData(receipt: any, payment: any) {
        const listReceipt = new Map(receipt.map(
            rm => [new Date(rm.Thang).getMonth(), rm.TongThu]
        ))

        const listPayment = new Map(payment.map(
            pm => [new Date(pm.Thang).getMonth(), pm.TongChi]
        ))

        const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        
        return months.map(m => ({
            Thang: m + 1,
            TongThu: listReceipt.get(m) ? Number(listReceipt.get(m)) : 0,
            TongChi: listPayment.get(m) ? Number(listPayment.get(m)) : 0
        }))
    }
}