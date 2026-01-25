import { ConflictException, Injectable } from "@nestjs/common";
import { DateHelper } from "src/common/date.helper";
import { PrismaService } from "src/prisma/prisma.service";

type MonthlyData = {
    month: number,
    amount: number
}

type OverdueInvoice = {
    code: string,
    student: string,
    class: string,
    debt: number,
    overdue: string
}

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    // tổng học viên, lớp học, ghi danh mới, tổng thu - chi trong tháng
    async GetSumary() {
        const { start, end } = DateHelper.GetStartEndOfMonth(new Date())
        const [activeStudents, activeClass, newEnrollments, totalDebt
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
                this.prisma.hoaDon.aggregate({
                    _sum: { TongTien: true, DaTra: true },
                    where: { // hóa đơn quá hạn
                        ThoiHan: { lt: new Date() },
                        TrangThai: null
                    }
                }),
                this.prisma.phieuThu.aggregate({
                    _sum: { SoTien: true },
                    where: {
                        NgayThu: { gte: start, lt: end }
                    }
                }),
                this.prisma.phieuChi.aggregate({
                    _sum: { SoTien: true },
                    where: {
                        NgayChi: { gte: start, lt: end }
                    }
                })
            ])
        const receipts = receiptThisMonth._sum.SoTien?.toNumber() ?? 0
        const payments = paymentThisMonth._sum.SoTien?.toNumber() ?? 0

        const total = totalDebt._sum.TongTien?.toNumber()
        const paidAmont = totalDebt._sum.DaTra?.toNumber()
        if (!total || !paidAmont)
            throw new ConflictException('Invoice: total or paidmount is null')
        return {
            activeStudents, activeClass, newEnrollments
            , receiptThisMonth: receipts,
            paymentThisMonth: payments,
            totalRevenue: receipts - payments,// doanh thu theo tháng
            totalDebt: total - paidAmont // nợ của hóa đơn quá hạn 
        }
    }

    // lấy dữ liệu thu - chi, ghi danh mới theo tháng để vẽ biểu đồ
    async GetFinaceChart(year: number) {
        const [receipts, payments, enrolls] = await Promise.all([
            this.prisma.$queryRaw<MonthlyData[]>`
            select date_part('month', pt."NgayThu") as "month", 
                sum (pt."SoTien") as "amount"
            from public."PhieuThu" as pt
            where date_part('year', pt."NgayThu") = ${year}
            group by "month"`,

            this.prisma.$queryRaw<MonthlyData[]>`
            select date_part('month', pc."NgayChi") as "month", 
                sum (pc."SoTien") as "amount"
            from public."PhieuChi" as pc
            where date_part('year', pc."NgayChi") = ${year}
            group by "month" `,

            this.prisma.$queryRaw<MonthlyData[]>`
            select date_part('month', gd."NgayGhiDanh") as "month", 
                count (gd."ID")::int as "amount"
            from public."GhiDanh" as gd
            where date_part('year', gd."NgayGhiDanh") = ${year}
			and gd."TrangThai" = 'ACTIVE'
            group by "month"`
        ])

        return this.MergeData(receipts, payments, enrolls)
    }

    // lấy danh sách buổi học hôm nay
    async GetTodaySession() {
        const { start, end } = DateHelper.GetStartEndOfDay(new Date())
        const sessionDB = await this.prisma.buoiHoc.findMany({
            where: {
                BatDauLuc: { gte: start },
                KetThucLuc: { lt: end }
            },
            select: {
                BatDauLuc: true, KetThucLuc: true, PhongHoc: true,
                lophoc: {
                    select: {
                        TenLop: true,
                        giaovien: { select: { User: { select: { HoTen: true } } } }
                    }
                },
                TrangThai: true
            },
            take: 10
        })
        return sessionDB.map(sm => ({
            time: DateHelper.ISOToHHMM(sm.BatDauLuc, sm.KetThucLuc),
            class: sm.lophoc.TenLop,
            teacher: sm.lophoc.giaovien.User.HoTen,
            room: sm.PhongHoc,
            status: sm.TrangThai
        }))
    }

    // lấy danh sách hóa đơn quá hạn 
    async GetOverdueInvoices() {
        return await this.prisma.$queryRaw<OverdueInvoice[]>`
        select hd."MaHoaDon" as "code", hv."TenHocVien" as "student", 
            lh."TenLop" as "class", hd."TongTien"-hd."DaTra" as "debt", 
            to_char(NOW()-hd."ThoiHan", 'DD') as "overdue" 
        from "HoaDon" as hd
            left join "GhiDanh" gd
            on hd."GhiDanhID" = gd."ID"
            left join "HocVien" hv
            on hv."ID" = gd."HocVienID"
            left join "LopHoc" lh
            on lh."ID" = gd."LopHocID"
        where hd."ThoiHan" < NOW()
            and hd."DaTra" < hd."TongTien"
            and hd."TrangThai" is null`
    }

    async GetExpiringClasses() {
        // remaining_days
        return await this.prisma.$queryRaw`
        select lh."MaLopHoc", lh."TenLop", 
            to_char(lh."DenNgay"-NOW(),'DD') as "ConLai"
        from "LopHoc" lh
        where lh."DenNgay" > NOW() 
        and lh."DenNgay" < (NOW()+interval '7 days')`
    }

    // lấy danh sách khóa học cần xử lý
    async GetPendingSessions() {
        const [requestUnlock, unSubmitted] = await Promise.all([
            // buổi học được yêu cầu mở khóa
            this.prisma.buoiHoc.findMany({
                where: { YeuCauMoKhoa: true },
                select: {
                    ID: true, BuoiSo: true, PhongHoc: true,
                    lophoc: { select: { giaovien: { select: { User: { select: { HoTen: true } } } } } },
                    LyDoMoKhoa: true, NgayYeuCau: true
                },
                orderBy: { NgayYeuCau: 'asc' }// ai trước xử lý trước
            }),
            //session > 48h chưa nhập điểm
            this.prisma.buoiHoc.findMany({
                where: { // 48h = 48 x 60p x 60 ms x 1000
                    KetThucLuc: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
                    TrangThai: 'SCHEDULED',
                    YeuCauMoKhoa: false
                },
                select: {
                    ID: true, BuoiSo: true, PhongHoc: true,
                    lophoc: { select: { giaovien: { select: { User: { select: { HoTen: true } } } } } }
                }
            })
        ])

        return {
            requestUnlock: requestUnlock.map(rm => ({
                id: rm.ID,
                lesson: rm.BuoiSo,
                room: rm.PhongHoc ?? "No room",
                teacher: rm.lophoc.giaovien.User.HoTen,
                reason: rm.LyDoMoKhoa,
                date: rm.NgayYeuCau
            })),

            unSubmitted: unSubmitted.map(um => ({
                id: um.ID,
                lesson: um.BuoiSo,
                room: um.PhongHoc ?? "No room",
                teacher: um.lophoc.giaovien.User.HoTen,
            }))
        }
    }

    // ghép 3 mảng dữ liệu 
    private MergeData(receipts: MonthlyData[], payments: MonthlyData[],
        enrolls: MonthlyData[]
    ) {
        const listReceipt = new Map(receipts.map(
            rm => [rm.month, Number(rm.amount)]
        ))

        const listPayment = new Map(payments.map(
            pm => [pm.month, Number(pm.amount)]
        ))

        const listEnroll = new Map(enrolls.map(
            em => [em.month, Number(em.amount)]
        ))

        const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

        return months.map(m => {
            const r = listReceipt.get(m) ?? 0
            const p = listPayment.get(m) ?? 0
            const e = listEnroll.get(m) ?? 0
            return {
                month: m,
                totalReceipt: r,
                totalPayment: p,
                totalRevenue: r - p,
                newEnrolls: e
            }
        })
    }
}