import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateStudentDTO, QueryStudentDTO, UpdateStudentDTO } from "./student.dto";
import { Prisma } from "src/generated/prisma/client";
import * as bcrypt from 'bcrypt'
import { EnrollService } from "../enroll/enroll.service";
import { InvoiceService } from "../invoice/invoice.service";
import { ClassService } from "../class/class.service";
import { CourseService } from "../course/course.service";

@Injectable()
export class StudentService {
    constructor(private prismaService: PrismaService,
        private classService: ClassService,
        private enrollService: EnrollService,
        private invoiceService: InvoiceService,
        private courseService: CourseService
    ) { }

    //kiểm tra trùng mã học viên
    async StudentCodeValidator(code: string) {
        const StudentDB = await this.prismaService.hocVien.findUnique({
            where: { MaHocVien: code }
        })
        if (StudentDB) throw new BadRequestException('Student code was duplicate')
    }

    //kiểm tra trùng email hoặc số điện thoại
    async Email_PhoneValidator(email: string, phone: string) {
        const userEmail = await this.prismaService.user.findUnique({
            where: { Email: email }
        })
        if (userEmail) throw new ConflictException(`Email: ${email} was used`)
        
        const userPhone = await this.prismaService.user.findUnique({
            where: { DienThoai: phone }
        })
        if (userPhone) throw new ConflictException(`Phone number: ${phone} was used`)
    }

    // kiểm tra học viên có tồn tại 
    async StudentIdValidator(studentId: number) {
        const StudentDB = await this.prismaService.hocVien.findUnique({
            where: { ID: studentId },
            omit: { UpdatedAt: true, CreatedAt: true }
        })
        if (!StudentDB) throw new BadRequestException('Student is not existed')
        return StudentDB
    }

    // thêm học viên + ghi danh + hóa đơn 
    async AddRecord_3Table(userId: number, body: CreateStudentDTO, tx?: Prisma.TransactionClient) {
        const student = body.student.trim()
        const parent = body.parent.trim()
        const code = body.code.trim()
        const classDB = await this.classService.GetClassById(body.classId)
        if (!classDB) throw new ConflictException('Class is not existed')

        const runLogic = async (client: Prisma.TransactionClient) => {
            const newStudent = await client.hocVien.create({
                data: {
                    MaHocVien: code,
                    TenHocVien: student,
                    TenPhuHuynh: parent,
                    NgaySinh: body.dob,
                    UserID: userId
                },
                omit: { CreatedAt: true, UpdatedAt: true }
            })

            //thêm ghi danh
            const newEnroll = await this.enrollService.CreateEnroll(newStudent.ID, body.classId, client)

            // thêm hóa đơn
            await this.invoiceService.CreateInvoice(newEnroll.ID, classDB?.DenNgay, body.fee, client)
            return { mgs: "succesfull" }
        }

        if (tx) return await runLogic(tx)
        else {
            return await this.prismaService.$transaction(async (newTX) => {
                return await runLogic(newTX)
            })
        }
    }

    // thêm học viên dựa vào user
    async CreateStudent(body: CreateStudentDTO) {
        await this.StudentCodeValidator(body.code)
        const userDB = await this.prismaService.user.findMany({
            where: {
                OR: [{ Email: body.email}, { DienThoai: body.phone }]
            }
        })

        // ko có user => tạo mới
        if (userDB.length == 0) {
            const hashPW = await bcrypt.hash(body.phone, 10)
            return await this.prismaService.$transaction(async (tx) => {
                // thêm user
                const newUser = await tx.user.create({
                    data: {
                        Email: body.email,
                        DienThoai: body.phone,
                        MatKhauHash: hashPW,
                        VaiTro: 'PARENT'
                    }
                })
                return await this.AddRecord_3Table(newUser.ID, body, tx)
            })
        }
        else if(userDB.length == 1){// tìm được 1 user => user cũ
            const oldUser = userDB[0]
            return await this.AddRecord_3Table(oldUser.ID, body)
        }
        else// tìm được nhiều hơn 1 user => trùng Email hoặc phone
            throw new ConflictException("The email and phone number are registered to different people")
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
                { TenPhuHuynh: { contains: q, mode: 'insensitive' } }
            ]
        }
        return await this.prismaService.hocVien.findMany({
            where,
            omit: { UpdatedAt: true, CreatedAt: true }
        })
    }

    // lấy chi tiết 1 học viên - phần trên
    async GetStudentByID(studentId: number) {
        const studentDB = await this.StudentIdValidator(studentId)
        if (studentDB) return studentDB
    }

    // sửa thông tin 1 học viên
    async UpdateStudentByID(studentId: number, body: UpdateStudentDTO) {
        await this.StudentIdValidator(studentId)
        const data: Prisma.HocVienUpdateInput = {}
        if (body.status === 'INACTIVE')
            await this.DelateStudentByID(studentId)

        data.TenHocVien = body.student?.trim()
        data.TenPhuHuynh = body.parent?.trim()
        data.GhiChu = body.note?.trim()
        return await this.prismaService.hocVien.update({
            where: { ID: studentId },
            data, omit: { CreatedAt: true, UpdatedAt: true }
        })
    }

    //xóa mềm học viên
    async DelateStudentByID(studentId: number) {
        await this.StudentIdValidator(studentId)
        await this.prismaService.$transaction([
            this.prismaService.hocVien.update({
                where: { ID: studentId, TrangThai: 'ACTIVE' },
                data: { TrangThai: 'INACTIVE' }
            }),
            this.prismaService.ghiDanh.updateMany({
                where: { HocVienID: studentId, TrangThai: 'ACTIVE' },
                data: { TrangThai: 'INACTIVE' }
            })
        ])
        return { mgs: "Succesfull" }
    }

    //lấy danh sách lớp học viên học - phần dưới
    async GetClassesByStudentID(studentId: number) {
        await this.StudentIdValidator(studentId)
        return await this.prismaService.ghiDanh.findMany({
            where: { HocVienID: studentId },
            select: {
                lophoc: { omit: { CreatedAt: true, UpdatedAt: true } }
            }
        })

    }
}