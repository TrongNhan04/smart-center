import { ConflictException, Injectable } from "@nestjs/common";
import { DateHelper } from "src/common/date.helper";
import { PrismaService } from "src/prisma/prisma.service";

type MonthlyData = {
    month: number,
    amount: number
}

type OverdueInvoice = {
    inv_id: number,
    inv_code: string,
    student_code: string,
    student_name: string,
    parent_phone: string,
    class: string,
    debt: number,
    payment_term: string
    overdue: number
}

type Notis = 'CREATE_MORE'|'ENDING_CLASS'

export interface lophoc {
    class_id: number, class_name: string,
    type: Notis, mgs:string
}

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    // tổng học viên active, ghi danh mới, tổng thu và nợ xấu trong tháng
    async GetSumary(month: number, year: number) {
        const now = new Date()
        const m = month ?? now.getMonth()
        const y = year ?? now.getFullYear()
        const { start, end } = DateHelper.GetStartEndOfMonth(new Date(y, m))

        const [activeStudents, newEnrollments, invoiceOverdue
            , receiptThisMonth] = await Promise.all([
                this.prisma.hocVien.count({ where: { TrangThai: 'ACTIVE' } }),
                this.prisma.ghiDanh.count({
                    where: {
                        NgayGhiDanh: {
                            gte: start, // bằng hoặc lớn hơn đầu tháng này
                            lt: end // nhỏ hơn đầu tháng sau
                        }
                    }
                }),
                this.prisma.hoaDon.findMany({
                    where: { TrangThai: 'ACTIVE', ThoiHan: { lt: now } }
                }),
                this.prisma.phieuThu.aggregate({
                    _sum: { SoTien: true },
                    where: {
                        NgayThu: { gte: start, lt: end }
                    }
                })
            ])

        let sum = 0
        for (var inv of invoiceOverdue) {
            const total = Number(inv.TongTien)
            const paid = Number(inv.DaTra)
            const debt = total - paid
            if (debt > 0)
                sum += debt
        }

        return {
            activeStudents, newEnrollments,
            receiptThisMonth: Number(receiptThisMonth._sum.SoTien), // tổng thu theo tháng
            totalDebt: sum
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
        const invoiceDB = await this.prisma.hoaDon.findMany({
            where: {
                TrangThai: 'ACTIVE',
                ThoiHan: { lt: new Date() }
            },
            select: {
                ID: true, MaHoaDon: true, TongTien: true,
                DaTra: true, ThoiHan: true,
                ghidanh: {
                    select: {
                        hocvien: {
                            select: {
                                TenHocVien: true, MaHocVien: true,
                                Parent: { select: { DienThoai: true } }
                            }
                        },
                        lophoc: { select: { TenLop: true } }
                    }
                }
            }, orderBy: { ThoiHan: 'asc' }, take:5
        })

        const debts: OverdueInvoice[] = []
        for (var inv of invoiceDB) {
            const total = Number(inv.TongTien)
            const paid = Number(inv.DaTra)
            if (paid < total) {
                const debt = total - paid

                const overTime = Math.abs(new Date().getTime() - inv.ThoiHan.getTime())
                const overDay = Math.floor(overTime / (24 * 60 * 60 * 1000))

                debts.push({
                    inv_id: inv.ID,
                    inv_code: inv.MaHoaDon,
                    student_code: inv.ghidanh.hocvien.MaHocVien,
                    student_name: inv.ghidanh.hocvien.TenHocVien,
                    parent_phone: inv.ghidanh.hocvien.Parent.DienThoai,
                    class: inv.ghidanh.lophoc.TenLop,
                    debt: debt,
                    payment_term: inv.ThoiHan.toLocaleDateString(),
                    overdue: overDay
                })
            }
        }
        return debts
    }

    // lấy danh sách lớp gần hết buổi học hoặc cần sinh thêm buổi
    async GetExpiringClasses() {
        const classDB = await this.prisma.lopHoc.findMany({
            where: { TrangThai: 'RUNNING' },
            include: {
                khoahoc: true, // lấy tổng buổi khóa
                _count: { select: { buoihoc: true } } // lấy tổng buổi đã tạo
            }
        })

        const alert:lophoc[] = []

        for(var lh of classDB){
            const future = await this.prisma.buoiHoc.count({
                where:{LopHocID:lh.ID, TrangThai:'SCHEDULED'}
            })

            const total = lh.khoahoc.TongSoBuoi
            const created = lh._count.buoihoc

            if(future<=3){
                if(created<total){
                    alert.push({
                        class_id: lh.ID,
                        class_name: lh.TenLop,
                        type:'CREATE_MORE',
                        mgs:`The class schedule is almost finished. Created ${created}/${total} sessions`
                    })
                }
                else{
                    alert.push({
                        class_id: lh.ID,
                        class_name: lh.TenLop,
                        type:'ENDING_CLASS',
                        mgs:`The class is about to end. Please check the unpaid tuition fees`
                    })
                }
            }
        }
        return alert
    }

    // lấy danh sách buổi học cần xử lý
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