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

    // thêm học viên + ghi danh + hóa đơn 
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
            const newEnroll = await this.enrollService.CreateEnrollAuto
                (newStudent.ID, body.classId, client)

            // thêm hóa đơn
            const newInvoice = await this.invoiceService.CreateInvoice
                (newStudent.ID, newEnroll.ID, classDB?.DenNgay, fee, client)

            // thêm thông báo
            await this.notisService.InvoiceNotify(userId, newInvoice, client)
        }
        // nếu có user
        if (tx) return await runLogic(tx)
        else { // ko có 
            return await this.prismaSv.$transaction(async (newTX) => {
                return await runLogic(newTX)
            })
        }
    }

    // thêm học viên dựa vào user
    async CreateStudent(body: CreateStudentDTO) {
        await this.StudentCodeValidator(body.code)
        await this.enrollService.TotalSlot(body.classId)
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
                ("Email và số điện thoại được dùng bởi 2 người khác nhau")
    }

    // lấy danh sách + tìm kiếm + lọc theo điều kiện
    async GetStudents(query: QueryStudentDTO) {
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
        return studentDB.map(item => ({
            ID: item.ID,
            MaHocVien: item.MaHocVien,
            TenHocVien: item.TenHocVien,
            NgaySinh: item.NgaySinh,
            DiaChi: item.DiaChi,
            PhuHuynh: item.Parent.HoTen,
            DienThoai: item.Parent.DienThoai,
            Email: item.Parent.Email,
            TrangThai: item.TrangThai
        }))
    }

    // lấy dang sách học viên cho combobox
    async GetDataForCmb() {
        return await this.prismaSv.hocVien.findMany({
            where: { TrangThai: 'ACTIVE' },
            select: {
                ID: true, MaHocVien: true, TenHocVien: true
            },
            orderBy: { MaHocVien: 'asc' }
        })
    }

    // lấy chi tiết 1 học viên - phần trên
    async GetStudentByID(studentId: number) {
        const studentDB = await this.StudentIdValidator(studentId)
        if (!studentDB)
            throw new NotFoundException('Không tìm thấy học viên')
        return {
            ID: studentDB.ID,
            MaHocVien: studentDB.MaHocVien,
            TenHocVien: studentDB.TenHocVien,
            NgaySinh: studentDB.NgaySinh,
            DiaChi: studentDB.DiaChi,
            PhuHuynh: studentDB.Parent.HoTen,
            DienThoai: studentDB.Parent.DienThoai,
            Email: studentDB.Parent.Email,
            TrangThai: studentDB.TrangThai
        }
    }

    // sửa thông tin 1 học viên
    async UpdateStudentByID(studentId: number, body: UpdateStudentDTO) {
        const studentDB = await this.StudentIdValidator(studentId)

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
    async DeleteStudentByID(studentId: number) {
        const studentDB = await this.StudentIdValidator(studentId)
        return await this.prismaSv.$transaction([
            this.prismaSv.hocVien.update({
                where: { ID: studentDB.ID, TrangThai: 'ACTIVE' },
                data: { TrangThai: 'INACTIVE' }
            }),
            this.prismaSv.ghiDanh.updateMany({
                where: { HocVienID: studentDB.ID, TrangThai: 'ACTIVE' },
                data: { TrangThai: 'INACTIVE' }
            })
        ])
    }

    //lấy danh sách lớp học viên học - phần dưới
    async GetClassesByStudentID(studentId: number) {
        const studentDB = await this.StudentIdValidator(studentId)
        const enrollDB = await this.prismaSv.ghiDanh.findMany({
            where: { HocVienID: studentDB.ID, TrangThai: 'ACTIVE' },
            select: {
                NgayGhiDanh: true, TrangThai: true,
                lophoc: {
                    select: {
                        ID: true, MaLopHoc: true, TenLop: true,
                        LichHoc: true, TuNgay: true, DenNgay: true,
                        GioBatDau: true, GioKetThuc: true,
                        GiaoVienID: true,
                        giaovien: { select: { User: { select: { HoTen: true } } } },
                        khoahoc: { select: { TongSoBuoi: true } },
                        _count: {
                            select: { buoihoc: { where: { TrangThai: 'COMPLETED' } } }
                        },
                    }
                },
                ketqua_chitiet: { select: { DiemDanh: true } }
            }
        })

        return enrollDB.map(lh => ({
            ID: lh.lophoc.ID, MaLopHoc: lh.lophoc.MaLopHoc,
            TenLop: lh.lophoc.TenLop,
            GiaoVien: lh.lophoc.giaovien.User.HoTen,
            LichHoc: lh.lophoc.LichHoc,
            TuNgay: lh.lophoc.TuNgay,
            GioHoc: lh.lophoc.GioBatDau + ' - ' + lh.lophoc.GioKetThuc,
            TongSoBuoi: lh.lophoc.khoahoc.TongSoBuoi,
            BuoiDaHoc: lh.lophoc._count.buoihoc,
            NgayGhiDanh: lh.NgayGhiDanh,
            TrangThaiGD: lh.TrangThai,
            DiemDanh: lh.ketqua_chitiet
        }))
    }

    // thống kê kết quả học tập 1 lớp mà học viên học
    async GetClassResultById(studentId: number, classId: number) {
        const studentDB = await this.StudentIdValidator(studentId)
        const classDB = await this.prismaSv.lopHoc.findUnique({
            where: { ID: classId },
            select: {
                TenLop: true, GioBatDau: true, GioKetThuc: true, PhongHoc: true,
                giaovien: {
                    select: { User: { select: { HoTen: true } } }
                }
            }
        })
        if (!classDB) throw new NotFoundException('Không tìm thấy lớp học')
        const result = await this.prismaSv.ketQua_ChiTiet.findMany({
            where: {
                ghidanh: { HocVienID: studentDB.ID, LopHocID: classId }
            },
            orderBy: { ketqua_buoihoc: { buoihoc: { BatDauLuc: 'asc' } } },
            select: {
                ID: true, NhanXetRieng: true, DiemDanh: true, Diem: true,
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
    async GetManyInvoiceById(studentId: number) {
        const studentDB = await this.StudentIdValidator(studentId)
        const invoiceDB = await this.prismaSv.hoaDon.findMany({
            where: { HocVienID: studentDB.ID },
            // mã hd, lớp, học phí, đã trả, hạn thanh toán
            select: {
                ID: true, MaHoaDon: true,
                TongTien: true, DaTra: true,
                ThoiHan: true, TrangThai: true,
                ghidanh: { select: { lophoc: { select: { TenLop: true } } } }
            }
        })
        return invoiceDB.map(item=>{
            const {ghidanh, ...rest} = item
            return {
                ...rest, TenLop: ghidanh?.lophoc.TenLop
            }
        })
    }

    //kiểm tra trùng mã học viên
    private async StudentCodeValidator(code: string) {
        const StudentDB = await this.prismaSv.hocVien.findUnique({
            where: { MaHocVien: code }
        })
        if (StudentDB) throw new BadRequestException('Trùng mã học viên')
        return StudentDB
    }

    // kiểm tra học viên có tồn tại 
    private async StudentIdValidator(studentId: number) {
        const StudentDB = await this.prismaSv.hocVien.findUnique({
            where: { ID: studentId },
            omit: { UpdatedAt: true, CreatedAt: true },
            include: { Parent: true }
        })
        if (!StudentDB) throw new NotFoundException('Không tìm thấy học viên')
        return StudentDB
    }
}