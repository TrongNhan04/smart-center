import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateStudentDTO, QueryStudentDTO, UpdateStudentDTO } from "./student.dto";
import { Prisma } from "src/generated/prisma/client";
import * as bcrypt from 'bcrypt'
import { EnrollService } from "../enroll/enroll.service";
import { InvoiceService } from "../invoice/invoice.service";
import { NotifyService } from "../notify/notify.service";

@Injectable()
export class StudentService {
    constructor(
        private prismaSv: PrismaService,
        private enrollService: EnrollService,
        private invoiceService: InvoiceService,
        private notisService: NotifyService
    ) { }

    // thêm học viên + ghi danh + hóa đơn + thông báo
    private async AddRecord_3Table(userId: number, body: CreateStudentDTO,
        tx?: Prisma.TransactionClient) {
        const classDB = await this.prismaSv.lopHoc.findUnique({
            where: { ID: body.classId },
            select: {
                ID: true, DenNgay: true,
                khoahoc: { select: { HocPhi: true } }
            }
        })
        if (!classDB) throw new NotFoundException('Không tìm thấy lớp học')
        const fee = body.fee ?? classDB.khoahoc.HocPhi

        const runLogic = async (client: Prisma.TransactionClient) => {
            const newStudent = await client.hocVien.create({
                data: {
                    MaHocVien: body.code.trim(),
                    TenHocVien: body.student.trim(),
                    NgaySinh: body.dob,
                    UserID: userId
                }
            })

            //thêm ghi danh
            const newEnroll = await this.enrollService.createTx
                (newStudent.ID, body.classId, client)

            // thêm hóa đơn
            const newInvoice = await this.invoiceService.createTx
                (newStudent.ID, newEnroll.ID, classDB?.DenNgay, fee, client)

            // thêm thông báo
            console.log(userId)
            await this.notisService.createInvoiceNotify(userId, newInvoice, client)

            return {ID:newStudent.ID}
        }
        // nếu có user
        if (tx) return await runLogic(tx) // tx từ user
        else { // ko có 
            return await this.prismaSv.$transaction(async (newTX) => {
                return await runLogic(newTX)
            })
        }
    }

    // thêm học viên dựa vào user
    async create(body: CreateStudentDTO) {
        await Promise.all([
            this.codeValidator(body.code),
            this.enrollService.TotalSlot(body.classId)
        ])
        const userDB = await this.prismaSv.user.findMany({
            where: {
                OR: [{ Email: body.email }, { DienThoai: body.phone }]
            }
        })
        // ko có user => tạo mới
        if (userDB.length == 0) {
            const hashPW = await bcrypt.hash(body.phone, 15)
            return await this.prismaSv.$transaction(async (tx) => {
                // thêm user
                const newUser = await tx.user.create({
                    data: {
                        HoTen: body.parent.trim(),
                        Email: body.email,
                        DienThoai: body.phone,
                        MatKhauHash: hashPW,
                        VaiTro: 'PARENT'
                    }
                })
                return await this.AddRecord_3Table(newUser.ID, body, tx)
            })
        }
        else if (userDB.length == 1) {// tìm được 1 user => user cũ
            const oldUser = userDB[0]
            return await this.AddRecord_3Table(oldUser.ID, body)
        }
        else// tìm được nhiều hơn 1 user => trùng Email hoặc phone
            throw new ConflictException
                ("Email và số điện thoại được dùng bởi 2 tài khoản khác nhau")
    }

    // lấy danh sách + tìm kiếm + lọc theo điều kiện
    async getMany(query: QueryStudentDTO) {
        const where: Prisma.HocVienWhereInput = {}
        const q = query.q?.trim()
        if (query.status)
            where.TrangThai = query.status

        if (q) {
            where.OR = [
                { TenHocVien: { contains: q, mode: 'insensitive' } },
                { MaHocVien: { contains: q, mode: 'insensitive' } },
                { Parent: { HoTen: { contains: q, mode: 'insensitive' } } }
            ]
        }
        const studentDB = await this.prismaSv.hocVien.findMany({
            where,
            orderBy: { CreatedAt: 'desc' },
            include: { Parent: true }
        })
        return studentDB.map(item => {
            const { Parent, ...rest } = item
            return {
                ...rest,
                PhuHuynh: Parent.HoTen,
                DienThoai: Parent.DienThoai,
                Email: Parent.Email,
            }
        })
    }

    // lấy dang sách học viên cho combobox
    async getManyForCmb() {
        return await this.prismaSv.hocVien.findMany({
            where: { TrangThai: 'ACTIVE' },
            select: { ID: true, MaHocVien: true, TenHocVien: true },
            orderBy: { MaHocVien: 'asc' }
        })
    }

    // lấy chi tiết 1 học viên - phần trên
    async getOne(studentId: number) {
        const studentDB = await this.idValidator(studentId)
        const { Parent, ...rest } = studentDB
        return {
            ...rest,
            PhuHuynh: Parent.HoTen,
            DienThoai: Parent.DienThoai,
            Email: Parent.Email,
        }
    }

    // sửa thông tin 1 học viên
    async updateById(studentId: number, body: UpdateStudentDTO) {
        const studentDB = await this.idValidator(studentId)

        const dob = body.dob ?? studentDB.NgaySinh
        const student = body.student ?? studentDB.TenHocVien
        const parent = body.parent ?? studentDB.Parent.HoTen
        const address = body.address ?? studentDB.DiaChi
        await Promise.all([
            this.prismaSv.hocVien.update({
                where: { ID: studentDB.ID },
                data: {
                    NgaySinh: dob,
                    TenHocVien: student,
                    DiaChi: address
                }
            }),
            this.prismaSv.user.update({
                where: { ID: studentDB.UserID },
                data: { HoTen: parent }
            })
        ])
        return { ID: studentDB.ID }
    }

    //xóa mềm học viên + hủy ghi danh
    async deleteById(studentId: number) {
        const studentDB = await this.idValidator(studentId)
        return await this.prismaSv.hocVien.update({
            where: { ID: studentDB.ID },
            data: {
                TrangThai: 'INACTIVE',
                Ghidanh: {
                    updateMany: {
                        where: { TrangThai: 'ACTIVE' },
                        data: { TrangThai: 'INACTIVE' }
                    }
                }
            }
        })
    }

    //lấy danh sách lớp học viên học - phần dưới
    async getClassesById(studentId: number) {
        const studentDB = await this.idValidator(studentId)
        const enrollDB = await this.prismaSv.ghiDanh.findMany({
            where: { HocVienID: studentDB.ID, TrangThai: 'ACTIVE' },
            include: {
                lophoc: {
                    include: {
                        giaovien: { select: { User: { select: { HoTen: true } } } },
                        khoahoc: { select: { TongSoBuoi: true } },
                        _count: {
                            select: { buoihoc: { where: { TrangThai: 'COMPLETED' } } }
                        },
                    },
                    omit: { CreatedAt: true, UpdatedAt: true }
                },
                ketqua_chitiet: { select: { DiemDanh: true } }
            }
        })

        return enrollDB.map(enr => {
            const { lophoc, ketqua_chitiet, NgayGhiDanh, TrangThai } = enr
            const { giaovien, khoahoc, _count, ...restLopHoc } = lophoc
            return {
                ...restLopHoc,
                GiaoVien: giaovien.User.HoTen,
                GioHoc: lophoc.GioBatDau + ' - ' + lophoc.GioKetThuc,
                TongSoBuoi: khoahoc.TongSoBuoi,
                BuoiDaHoc: _count.buoihoc,
                NgayGhiDanh: NgayGhiDanh,
                TrangThai: TrangThai,
                DiemDanh: ketqua_chitiet
            }
        })
    }

    // thống kê kết quả học tập 1 lớp mà học viên học
    async getClassResultById(studentId: number, classId: number) {
        const studentDB = await this.idValidator(studentId)
        const classDB = await this.prismaSv.lopHoc.findUnique({
            where: { ID: classId },
            include: {
                giaovien: { select: { User: { select: { HoTen: true } } } }
            }
        })
        if (!classDB) throw new NotFoundException('Không tìm thấy lớp học')
        const result = await this.prismaSv.ketQua_ChiTiet.findMany({
            where: {
                ghidanh: { HocVienID: studentDB.ID, LopHocID: classDB.ID }
            },
            orderBy: { ketqua_buoihoc: { buoihoc: { BatDauLuc: 'asc' } } },
            include: {
                ketqua_buoihoc: {
                    select: {
                        NhanXetChung: true,
                        buoihoc: true, GiaoVienID: true,
                    }
                }
            }
        })
        return {
            LopHoc: classDB.TenLop,
            GiaoVien: classDB.giaovien.User.HoTen,
            GioHoc: classDB.GioBatDau + '-' + classDB.GioKetThuc,
            PhongHoc: classDB.PhongHoc,
            HocVien: studentDB.TenHocVien,
            KetQua: result.map(item => ({
                ID: item.ID, // id kết quả chi tiết
                BuoiSo: item.ketqua_buoihoc.buoihoc.BuoiSo,
                ChuDe: item.ketqua_buoihoc.buoihoc.ChuDe,
                BatDauLuc: item.ketqua_buoihoc.buoihoc.BatDauLuc,
                NhanXet: item.NhanXetRieng || item.ketqua_buoihoc.NhanXetChung,
                DiemDanh: item.DiemDanh,
                Diem: item.Diem
            }))
        }
    }

    // lấy danh sách hóa đơn của học viên
    async getInvoicesById(studentId: number) {
        const studentDB = await this.idValidator(studentId)
        const invoiceDB = await this.prismaSv.hoaDon.findMany({
            where: { HocVienID: studentDB.ID },
            include: { ghidanh: { select: { lophoc: { select: { TenLop: true } } } } },
            omit:{CreatedAt:true, UpdatedAt:true}
        })
        return invoiceDB.map(item => {
            const { ghidanh, ...rest } = item
            return {
                ...rest, TenLop: ghidanh?.lophoc.TenLop
            }
        })
    }

    //kiểm tra trùng mã học viên
    private async codeValidator(code: string) {
        const StudentDB = await this.prismaSv.hocVien.findUnique({
            where: { MaHocVien: code }
        })
        if (StudentDB) throw new BadRequestException('Trùng mã học viên')
        return StudentDB
    }

    // kiểm tra học viên có tồn tại 
    private async idValidator(studentId: number) {
        const StudentDB = await this.prismaSv.hocVien.findUnique({
            where: { ID: studentId },
            omit: { UpdatedAt: true, CreatedAt: true },
            include: { Parent: true }
        })
        if (!StudentDB) throw new NotFoundException('Không tìm thấy học viên')
        return StudentDB
    }
}