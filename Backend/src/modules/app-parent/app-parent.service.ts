import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DateHelper } from "src/common/date.helper";
import { PrismaService } from "src/prisma/prisma.service";
import { Pagination } from "../session/session.dto";
import { startOfMonth } from "date-fns";
import { Prisma } from "src/generated/prisma/client";

@Injectable()
export class AppParentService {
    constructor(
        private prisma: PrismaService
    ) { }

    // lấy thông tin tài khoản + danh sách con
    async GetProfile(userId: number) {
        return await this.prisma.user.findUnique({
            where: { ID: userId },
            select: {
                Email: true, DienThoai: true, HoTen: true,
                HocVien: {
                    select: { ID: true, TenHocVien: true }
                }
            }
        })
    }

    // Tab trang chủ: buổi học sắp tới, kết quả gần nhất,
    //  nhắc đóng học phí chưa thanh toán của HỌC VIÊN
    async GetDashboard(userId: number, studentId: number) {
        await this.StudentValidator(userId, studentId)
        const [nextSS, lastestResult, invoice] = await Promise.all([
            // buổi học sắp tới 
            this.prisma.buoiHoc.findFirst({
                where: {
                    BatDauLuc: { gte: new Date() },
                    TrangThai: 'SCHEDULED',
                    lophoc: {
                        ghidanh: {
                            some: {
                                HocVienID: studentId,
                                TrangThai: 'ACTIVE'
                            }
                        }
                    }
                },
                orderBy: { BatDauLuc: 'asc' },
                select: {
                    ID: true, PhongHoc: true, BuoiSo: true, ChuDe: true,
                    BatDauLuc: true, KetThucLuc: true,
                    lophoc: {
                        select: {
                            TenLop: true,
                            giaovien: { select: { User: { select: { HoTen: true } } } }
                        }
                    },
                }
            }),
            // kết quả gần nhất
            this.prisma.ketQua_ChiTiet.findFirst({
                where: {
                    ghidanh: { HocVienID: studentId }
                },
                select: {
                    ketqua_buoihoc: {
                        select: {
                            NhanXetChung: true,
                            giaovien: { select: { User: { select: { HoTen: true } } } },
                            buoihoc: { select: { BatDauLuc: true, ChuDe: true } }
                        }
                    },
                    NhanXetRieng: true,
                    DiemDanh: true,
                    Diem: true
                },
                orderBy: { UpdatedAt: 'desc' }
            }),
            //lấy số hóa đơn chưa thanh toán
            this.prisma.hoaDon.findMany({
                where: {
                    ghidanh: { HocVienID: studentId }
                }
            })
        ])
        if (!nextSS) throw new BadRequestException('Session not found')
        if (!lastestResult) throw new BadRequestException('Student don\'t have any result')
        const invoiceFilter = invoice.filter(f => {
            return f.DaTra < f.TongTien
        })

        return {
            nextSS: {
                id: nextSS.ID, lesson: nextSS.BuoiSo, room: nextSS.PhongHoc ?? '',
                date: nextSS.BatDauLuc.toLocaleDateString(),
                time: DateHelper.ISOToHHMM(nextSS.BatDauLuc, nextSS.KetThucLuc),
                class: nextSS.lophoc.TenLop,
                teacher: nextSS.lophoc.giaovien.User.HoTen
            },
            lastestResult: {
                teacher: lastestResult.ketqua_buoihoc.giaovien.User.HoTen,
                lesson: lastestResult.ketqua_buoihoc.buoihoc.ChuDe,
                date: lastestResult.ketqua_buoihoc.buoihoc.BatDauLuc.toLocaleDateString(),
                comment: lastestResult.ketqua_buoihoc.NhanXetChung,
                privateComment: lastestResult.NhanXetRieng,
                attend: lastestResult.DiemDanh,
                grade: lastestResult.Diem?.toNumber(),
            },
            invoice: {
                unpaidCount: invoiceFilter.length,
                deadline: invoiceFilter.length > 0 ? invoiceFilter[0].ThoiHan : null
            }
        }
    }

    // lấy danh sách buổi học của học viên
    async GetSessionByStudentID(userId: number, studentId: number, p: Pagination) {
        const take = +p.limit
        const skip = (+p.page - 1) * (+p.limit)
        await this.StudentValidator(userId, studentId)
        const sessionDB = await this.prisma.buoiHoc.findMany({
            where: {
                lophoc: {
                    ghidanh: {
                        some: {
                            HocVienID: studentId
                        }
                    }
                }
            },
            take: take, skip: skip,
            orderBy: { BatDauLuc: 'asc' }
        })

        return {
            sessionDB: sessionDB.map(sm => ({
                id: sm.ID, session: sm.BuoiSo, topic: sm.ChuDe,
                date: sm.BatDauLuc.toLocaleDateString(),
                time: DateHelper.ISOToHHMM(sm.BatDauLuc, sm.KetThucLuc)
            })),
            total: sessionDB.length
        }
    }

    // tab buổi học phần trên: đtb, %tham gia, biểu đồ
    async GetResultSumary(userId: number, studentId: number) {
        // tính điểm trung bình tháng -> avg._avg.Diem
        // tính tổng số buổi học đã diễn ra -> result.length
        // tính tổng số buổi học học viên tham gia -> avg._count.ID
        // lấy dữ liệu 5 buổi học tham gần nhất vẽ điểm  -> results
        const { start } = DateHelper.GetStartEndOfMonth(new Date())
        await this.StudentValidator(userId, studentId)

        const baseWhere: Prisma.KetQua_ChiTietWhereInput = {
            ketqua_buoihoc: {
                buoihoc: {
                    TrangThai: { not: 'CANCELLED' },
                    BatDauLuc: { gte: start },
                    KetThucLuc: { lte: new Date() }
                }
            },
            ghidanh: { HocVienID: studentId }
        }
        const [avg, results] = await Promise.all([
            // tính trung bình tháng + tổng buổi đi học
            this.prisma.ketQua_ChiTiet.aggregate({
                _count: { ID: true },
                _avg: { Diem: true },
                where: {
                    ...baseWhere,
                    DiemDanh: true
                }
            })
            // các buổi đã diễn ra 
            , this.prisma.ketQua_ChiTiet.findMany({
                where: { ...baseWhere },
                orderBy: { ketqua_buoihoc: { buoihoc: { BatDauLuc: 'asc' } } },
                include: { ketqua_buoihoc: { include: { buoihoc: true } } },
            })
        ])
        return {
            average_score: Number(avg._avg.Diem),
            attendance: {
                total: results.length,
                attend: avg._count.ID,
                percent: (avg._count.ID / results.length) * 100
            },
            chart_data: results.map(m => ({
                date: m.ketqua_buoihoc.buoihoc.BatDauLuc.toLocaleDateString(),
                grade: m.Diem ? Number(m.Diem) : m.Diem
            }))
        }
    }

    // Tab buổi học phần dưới: các buổi đã học (phân trang) 
    async GetSessionResults(userId: number, studentId: number, p: Pagination) {
        await this.StudentValidator(userId, studentId)
        const take = Number(p.limit)
        const skip = Number(p.page - 1) * Number(p.limit)
        const results = await this.prisma.ketQua_ChiTiet.findMany({
            where: {
                ketqua_buoihoc: {
                    buoihoc: {
                        TrangThai: { not: 'CANCELLED' },
                        KetThucLuc: { lte: new Date() }
                    }
                },
                ghidanh: { HocVienID: studentId }
            },
            select: {
                Diem: true,
                ketqua_buoihoc: {
                    select: {
                        buoihoc: {
                            select: {
                                BatDauLuc: true, ChuDe: true,
                                lophoc: { select: { TenLop: true } }
                            }
                        }
                    }
                }
            },
            take: take, skip: skip
        })
        return {  //lịch sử buổi học gồm ngày, lớp, chủ đề, điểm
            session_results: results.map(m => ({
                date: m.ketqua_buoihoc.buoihoc.BatDauLuc.toLocaleDateString(),
                class: m.ketqua_buoihoc.buoihoc.lophoc.TenLop,
                topic: m.ketqua_buoihoc.buoihoc.ChuDe,
                grade: m.Diem
            }))
        }
    }

    // phần dưới: chi tiết các buổi học 
    async GetSessionDetail(userId: number, studentId: number, sessionId: number) {
        //nhận xét, điểm, điểm danh, ngày học, lớp, giáo viên, chủ đề học, phòng
        await this.StudentValidator(userId, studentId)
        const detail = await this.prisma.ketQua_ChiTiet.findFirst({
            where: {
                ketqua_buoihoc: { BuoiHocID: sessionId },
                ghidanh: { HocVienID: studentId }
            },
            select: {
                NhanXetRieng: true, Diem: true, DiemDanh: true,
                ketqua_buoihoc: {
                    select: {
                        NhanXetChung: true,
                        buoihoc: {
                            select: {
                                BatDauLuc: true, ChuDe: true, PhongHoc: true,
                                lophoc: {
                                    select: {
                                        TenLop: true,
                                        giaovien: { select: { User: { select: { HoTen: true } } } }
                                    }
                                }
                            }
                        }
                    }
                }

            }
        })
        if (!detail) throw new NotFoundException('Student\'s result not found')
        return {
            comment: detail.NhanXetRieng ?? detail.ketqua_buoihoc.NhanXetChung,
            grade: detail.Diem, attend: detail.DiemDanh,
            date: detail.ketqua_buoihoc.buoihoc.BatDauLuc.toLocaleDateString(),
            class: detail.ketqua_buoihoc.buoihoc.lophoc.TenLop,
            teacher: detail.ketqua_buoihoc.buoihoc.lophoc.giaovien.User.HoTen,
            topic: detail.ketqua_buoihoc.buoihoc.ChuDe,
            room: detail.ketqua_buoihoc.buoihoc.PhongHoc
        }
    }

    // lấy danh sách hóa đơn của học viên
    async GetInvoiceByStudentID(userId: number, studentId: number) {
        await this.StudentValidator(userId, studentId)
        const inv = await this.prisma.hoaDon.findMany({
            where: { ghidanh: { HocVienID: studentId } }
        })
        return inv.map(m => ({
            id: m.ID,
            code: m.MaHoaDon,
            total: Number(m.TongTien),
            paid: Number(m.DaTra),
            debt: m.TrangThai ? 0 : Number(m.TongTien) - Number(m.DaTra),
            status: m.TrangThai,
            term: m.ThoiHan,
            note: m.GhiChu
        }))
    }

    // check con ai người nấy xem
    private async StudentValidator(userId: number, studentId: number) {
        const studentDB = await this.prisma.hocVien.findUnique({
            where: { ID: studentId, UserID: userId }
        })
        if (!studentDB) throw new NotFoundException('Student not found')
        return { userId, studentId }
    }
}