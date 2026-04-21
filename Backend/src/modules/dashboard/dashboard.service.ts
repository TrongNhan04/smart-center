import { Injectable, NotFoundException } from "@nestjs/common";
import { DateHelper } from "src/common/date.helper";
import { PrismaService } from "src/prisma/prisma.service";
import { RemindTeacher } from "./dashboard.dto";
import { BuoiHocWhereInput } from "src/generated/prisma/models";

type MonthlyData = {
    month: number,
    amount: number,
    type?: string
}

type Notis = 'CREATE_MORE' | 'ENDING_CLASS'

export interface lophoc {
    LopHocID: number, TenLop: string, GiaoVienID: number,
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
        let profit = 0
        if (!transactions.length) profit = 0
        for (const item of transactions) {
            const SoTien = Number(item._sum.SoTien)
            if (item.LoaiGiaoDich === 'RECEIPT') profit += SoTien
            else profit -= SoTien
        }

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

    // lấy 12 lớp có doanh thu cao nhất
    async GetHighestRevenue() {
        const classDB = await this.prisma.lopHoc.findMany({
            select: {
                ID: true, MaLopHoc: true, TenLop: true,
                ghidanh: { select: { hoadon: true } }
            }
        })
        return classDB.map(item => ({
            LopHocID: item.ID,
            MaLopHoc: item.MaLopHoc,
            TenLop: item.TenLop,
            DoanhThu: item.ghidanh.reduce((sum, item) => {
                return sum += Number(item.hoadon?.DaTra)
            }, 0)
        }))
            .sort((a, b) => b.DoanhThu - a.DoanhThu).slice(0, 12)
        //tăng là a-b, giảm là b-a, cắt lấy 12 ptu
    }

    // lấy danh sách buổi học trong 1 tháng
    async GetSessionOfMonth(month: number, year: number, userId: number | null) {
        const date = new Date(year, month)
        const { start, end } = DateHelper.GetStartEndOfMonth(date)
        const where: BuoiHocWhereInput = {
            BatDauLuc: { gte: start },
            KetThucLuc: { lt: end },
            TrangThai: { not: 'CANCELLED' },
        }
        if (userId) // giáo viên
            where.lophoc = { giaovien: { UserID: userId } }

        const sessionDB = await this.prisma.buoiHoc.findMany({
            where: where,
            include: {
                lophoc: {
                    select: {
                        ID: true, TenLop: true, PhongHoc: true,
                        _count: { select: { ghidanh: { where: { TrangThai: 'ACTIVE' } } } }
                    },
                },
            },
            orderBy: { BatDauLuc: 'asc' }
        })
        return sessionDB.map(item => ({
            ID: item.ID, // id buổi học
            LopHocID: item.lophoc.ID,
            TenLop: item.lophoc.TenLop,
            BuoiSo: item.BuoiSo,
            NgayHoc: item.BatDauLuc.toISOString().slice(0, 10),
            GioHoc: DateHelper.ISOToHHMM(item.BatDauLuc, item.KetThucLuc),
            PhongHoc: item.lophoc.PhongHoc,
            TongGhiDanh: item.lophoc._count.ghidanh
        }))
    }

    // lấy danh sách lớp cần sinh thêm buổi
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
            }) // tổng số buổi tương lai

            const total = lh.khoahoc.TongSoBuoi // tổng số buổi của khóa
            const created = lh._count.buoihoc // số buổi học đã tạo 
            // còn 3 buổi chưa học và số buổi đã tạo nhỏ hơn tổng số buổi
            if (future <= 3 && created < total) {
                alert.push({    
                    LopHocID: lh.ID,
                    TenLop: lh.TenLop,
                    GiaoVienID: lh.GiaoVienID,
                    Loai: 'CREATE_MORE',
                    LoiNhan: `Lịch học của lớp sắp hết. Đã tạo ${created}/${total} buổi học`
                })
            }
        }
        return alert
    }

    // lấy danh sách buổi học cần xử lý
    async GetPendingSessions() {
        const [requestUnlock, classDB, unSubmitted] = await Promise.all([
            // buổi học được yêu cầu mở khóa
            this.prisma.buoiHoc.findMany({
                where: { YeuCauMoKhoa: true, AdminMoKhoa: false },
                select: {
                    ID: true, BuoiSo: true, LopHocID: true,
                    lophoc: {
                        select: {
                            TenLop: true, GiaoVienID: true,
                            giaovien: { select: { User: { select: { HoTen: true } } } }
                        }
                    },
                    LyDoMoKhoa: true, NgayYeuCau: true
                },
                take: 10,
                orderBy: { NgayYeuCau: 'asc' }// ai trước xử lý trước
            }),

            this.GetExpiringClasses(), // lớp cần bổ sung lịch học

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
                            TenLop: true, GiaoVienID: true,
                            giaovien: { select: { User: { select: { HoTen: true } } } }
                        }
                    }
                },
                orderBy: { BatDauLuc: 'asc' }, take: 10
            })
        ])

        const mapData = (data: any, type?: string) =>
            data.map((item: any) => ({
                BuoiHocID: item.ID,
                BuoiSo: item.BuoiSo,
                LopHocID: item.LopHocID,
                TenLop: item.lophoc.TenLop,
                GiaoVienID: item.lophoc.GiaoVienID,
                GiaoVien: item.lophoc.giaovien.User.HoTen,
                LoiNhan: item.LyDoMoKhoa || null,
                Ngay: item.NgayYeuCau || item.BatDauLuc,
                Loai: type
            }))

        return [
            ...mapData(requestUnlock, 'REQUEST'),
            ...classDB,
            ...mapData(unSubmitted, 'UNSUBMIT')
        ]
    }

    // gửi thông báo nhắc nhở giáo viên
    async RemindTeacher(teacherId: number, body: RemindTeacher) {
        const classDB = await this.prisma.lopHoc.findFirst({
            where: { ID: body.classId, GiaoVienID: teacherId },
            select: {
                ID: true, TenLop: true,
                giaovien: { select: { UserID: true } }
            }
        })
        if (!classDB) throw new NotFoundException('Không tìm thấy giáo viên hoặc lớp học')
        const sessionDB = await this.prisma.buoiHoc.findFirst({
            where:{ID:body.sessionId, LopHocID:classDB.ID}
        })
        if(!sessionDB) throw new NotFoundException('Không tìm thấy buổi học')
        await this.prisma.thongBao.create({
            data: {
                UserID: classDB.giaovien.UserID,
                TieuDe: "Thông báo hệ thống",
NoiDung: `Nhắc nhở GV chốt kết quả buổi học, lớp '${classDB.TenLop}' - buổi ${sessionDB.BuoiSo}`,
                Loai: 'SYSTERM_ARLERT',
                DuLieu: {
                    classId: classDB.ID,
                    sessionId: sessionDB.ID
                },
                DaDoc: false
            }
        })
    }

    // ghép 3 mảng dữ liệu 
    private MergeData(receipts: MonthlyData[], payments: MonthlyData[],
        enrolls: MonthlyData[]
    ) {
        // const listReceipt = new Map(receipts.map(
        //     rm => [rm.month, Number(rm.amount)]
        // ))

        // const listPayment = new Map(payments.map(
        //     pm => [pm.month, Number(pm.amount)]
        // ))

        const listEnroll = new Map(enrolls.map(
            em => [em.month, Number(em.amount)]
        ))

        const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

        return months.map(m => {
            // const r = listReceipt.get(m) ?? 0
            // const p = listPayment.get(m) ?? 0
            const e = listEnroll.get(m) ?? 0
            return {
                Thang: `T${m}`,
                // TongThu: r,
                // TongChi: p,
                // LoiNhuan: r - p,
                GhiDanhMoi: e
            }
        })
    }
}