import { Injectable } from "@nestjs/common";
import { DateHelper } from "src/common/date.helper";
import { PrismaService } from "src/prisma/prisma.service";

type MonthlyData = {
    month: number,
    amount: number,
    type?: string
}

type Notis = 'CREATE_MORE' | 'ENDING_CLASS'

export interface lophoc {
    LopHocID: number, TenLop: string,
    Loai: Notis, LoiNhan: string
}

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    // tổng học viên active, ghi danh mới, tổng thu và 
    // số hóa đơn còn hiệu lực nhưng vừa nợ vừa quá hạn
    async GetSumaries(month: number, year: number) {
        const now = new Date()
        const m = month ?? now.getMonth()
        const y = year ?? now.getFullYear()
        const { start, end } = DateHelper.GetStartEndOfMonth(new Date(y, m))

        const [activeStudents, newEnrollments, invoiceOverdue
            , transactions] = await Promise.all([
                this.prisma.hocVien.count({ where: { TrangThai: 'ACTIVE' } }),
                this.prisma.ghiDanh.count({
                    where: {
                        NgayGhiDanh: {
                            gte: start, // bằng hoặc lớn hơn đầu tháng này
                            lt: end // nhỏ hơn đầu tháng sau
                        }
                    }
                }),// lấy các hóa đơn quá hạn còn hiệu lực
                this.prisma.hoaDon.findMany({
                    where: { TrangThai: 'ACTIVE', ThoiHan: { lt: now } }
                }), // lấy các giao dịch trong tháng
                this.prisma.giaoDich.groupBy({
                    by: ['LoaiGiaoDich'],
                    _sum: { SoTien: true },
                    where: { NgayGiaoDich: { gte: start, lt: end } }
                })
            ])
        // lọc hóa đơn quá hạn còn hiệu lực để tìm ra những đứa còn nợ
        let countOverdue = 0
        let sumOverdue = 0
        invoiceOverdue.forEach(item => {
            if (item.DaTra < item.TongTien) {//còn nợ 
                countOverdue += 1
                sumOverdue += Number(item.TongTien) - Number(item.DaTra)
            }
        })

        const profit = Number(transactions[1]._sum.SoTien || 0) //RECEIPT
            - Number(transactions[0]._sum.SoTien || 0) //PAYMENT
        return {
            TongHocVien: activeStudents,
            GhiDanhMoi: newEnrollments,
            LoiNhuan: profit,
            HoaDonQuaHan: countOverdue, // số hóa đơn quá hạn còn nợ
            TongNoQuaHan: sumOverdue // tổng nợ quá hạn
        }
    }

    // lấy dữ liệu thu - chi, ghi danh mới theo tháng để vẽ biểu đồ
    async GetFinaceChart(year: number) {
        const [transactions, enrolls] = await Promise.all([
            this.prisma.$queryRaw<MonthlyData[]>`
            select date_part('month', gd."NgayGiaoDich") as "month", 
                sum (gd."SoTien") as "amount", gd."LoaiGiaoDich" as "type"
            from "GiaoDich" as gd
            where date_part('year', gd."NgayGiaoDich") = ${year}
            group by "month", gd."LoaiGiaoDich"`,

            this.prisma.$queryRaw<MonthlyData[]>`
            select date_part('month', gd."NgayGhiDanh") as "month", 
                count (gd."ID")::int as "amount"
            from public."GhiDanh" as gd
            where date_part('year', gd."NgayGhiDanh") = ${year}
        	and gd."TrangThai" = 'ACTIVE'
            group by "month"`
        ])

        const receipts: MonthlyData[] = []
        const payments: MonthlyData[] = []
        for (var item of transactions) {
            if (item.type === 'RECEIPT')
                receipts.push(item)
            if (item.type === 'PAYMENT')
                payments.push(item)
        }
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
            orderBy: { BatDauLuc: 'asc' }, take: 5
        })
        return sessionDB.map(sm => ({
            ThoiGian: DateHelper.ISOToHHMM(sm.BatDauLuc, sm.KetThucLuc),
            TenLop: sm.lophoc.TenLop,
            GiaoVien: sm.lophoc.giaovien.User.HoTen,
            PhongHoc: sm.PhongHoc,
            TrangThai: sm.TrangThai
        }))
    }

    // lấy danh sách lớp gần hết buổi học hoặc cần sinh thêm buổi
    async GetExpiringClasses() {
        const classDB = await this.prisma.lopHoc.findMany({
            where: { TrangThai: { not: 'CLOSED' } },
            include: {
                khoahoc: true, // lấy tổng buổi khóa
                _count: { select: { buoihoc: true } } // lấy tổng buổi đã tạo
            },
        })

        const alert: lophoc[] = []

        for (var lh of classDB) {
            const future = await this.prisma.buoiHoc.count({
                where: { LopHocID: lh.ID, TrangThai: 'SCHEDULED' }
            }) // số buổi đã tạo nhưng chưa học

            const total = lh.khoahoc.TongSoBuoi
            const created = lh._count.buoihoc // số buổi học đã tạo gồm chưa học hoặc đã học

            if (future <= 3) { // còn 3 buổi chưa học
                if (created < total) { // số buổi đã tạo nhỏ hơn tổng số buổi
                    alert.push({ // => auto nhắc tạo thêm buổi
                        LopHocID: lh.ID,
                        TenLop: lh.TenLop,
                        Loai: 'CREATE_MORE',
                        LoiNhan: `Lịch học của lớp gần hết. Đã tạo ${created}/${total} buổi học`
                    })
                }
                // else {
                //     alert.push({
                //         LopHocID: lh.ID,
                //         TenLop: lh.TenLop,
                //         Loai: 'ENDING_CLASS',
                //         LoiNhan: `Lớp học sắp kết thúc. Đừng quên kiểm tra các khoản phí chưa hoàn tất!`
                //     })
                // }
            }
        }
        return alert
    }

    // lấy danh sách buổi học cần xử lý
    async GetPendingSessions() {
        // const classDB = await this.GetExpiringClasses()
        const [requestUnlock, classDB, unSubmitted] = await Promise.all([
            // buổi học được yêu cầu mở khóa
            this.prisma.buoiHoc.findMany({
                where: { YeuCauMoKhoa: true, AdminMoKhoa: false },
                select: {
                    ID: true, BuoiSo: true, LopHocID: true,
                    lophoc: {
                        select: {
                            TenLop: true,
                            giaovien: { select: { User: { select: { HoTen: true } } } }
                        }
                    },
                    LyDoMoKhoa: true, NgayYeuCau: true
                },
                take: 10,
                orderBy: { NgayYeuCau: 'asc' }// ai trước xử lý trước
            }),

            this.GetExpiringClasses(),

            //session > 48h chưa nhập điểm
            this.prisma.buoiHoc.findMany({
                where: { // 48h = 48 x 60p x 60 ms x 1000
                    KetThucLuc: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
                    TrangThai: 'SCHEDULED',
                    YeuCauMoKhoa: false
                },
                select: {
                    ID: true, BuoiSo: true, LopHocID: true, BatDauLuc: true,
                    lophoc: {
                        select: {
                            TenLop: true,
                            giaovien: { select: { User: { select: { HoTen: true } } } }
                        }
                    }
                },
                orderBy: { BatDauLuc: 'asc' }, take: 10
            })
        ])

        const mapData = (data: any, type?: string) =>
            data.map(item => ({
                BuoiSo: item.BuoiSo,
                LopHocID: item.LopHocID,
                TenLop: item.lophoc.TenLop,
                GiaoVien: item.lophoc.giaovien.User.HoTen,
                LoiNhan: item.LyDoMoKhoa || null,
                Ngay: item.NgayYeuCau || item.BatDauLuc,
                Loai: type
            }))
        //return classes
        return [
            ...mapData(requestUnlock, 'REQUEST'),
            ...classDB,
            ...mapData(unSubmitted, 'UNSUBMIT')
        ]
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
                Thang: `T${m}`,
                TongThu: r,
                TongChi: p,
                LoiNhuan: r - p,
                GhiDanhMoi: e
            }
        })
    }
}