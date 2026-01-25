import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DateHelper } from "src/common/date.helper";
import { PrismaService } from "src/prisma/prisma.service";
import { Pagination } from "../session/session.dto";

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
            take: take, skip: skip
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

    // check con ai người nấy xem
    private async StudentValidator(userId: number, studentId: number) {
        const studentDB = await this.prisma.hocVien.findUnique({
            where: { ID: studentId, UserID: userId }
        })
        if (!studentDB) throw new NotFoundException('Student not found')
        return { userId, studentId }
    }
}