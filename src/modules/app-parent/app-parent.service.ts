import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

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

    // Tab trang chủ: buổi học sắp tới, 
    // kết quả gần nhất, nhắc đóng học phí sắp hết hạn
    async GetDashboard(userId: number, studentId: number) {
        await this.StudentValidator(userId, studentId)

        return await 
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
                    ID: true, PhongHoc: true,
                    BatDauLuc: true, KetThucLuc: true,
                    lophoc: {
                        select: {
                            TenLop: true,
                            giaovien: { select: { User: { select: { HoTen: true } } } }
                        }
                    },
                }
            })
        
        
    }
    private async StudentValidator(userId: number, studentId: number) {
        const studentDB = await this.prisma.hocVien.findUnique({
            where: { ID: studentId, UserID: userId }
        })
        if (!studentDB) throw new NotFoundException('Student not found')
        return { userId, studentId }
    }
}