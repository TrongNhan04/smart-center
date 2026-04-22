import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { QueryClassDTO, UpdateClassDTO, CreateClassDTO } from "./class.dto";
import { Prisma } from "src/generated/prisma/client";
import { DateHelper } from "src/common/date.helper";
import { LopHocWhereUniqueInput } from "src/generated/prisma/models";
import { classInclude, classIncludeTeacher } from "./class.include";

@Injectable()
export class ClassService {
  constructor(private prismaSv: PrismaService) { }
  // find: tìm có thể không có, get: chắc chắn có, ko có báo lỗi
  // thêm lớp mới
  async create(classDTO: CreateClassDTO) {
    await Promise.all([
      this.codeValidator(classDTO.code),
      this.courseIdValidator(classDTO.courseId),
      this.teacherIdValidator(classDTO.teacherId),
      this.duplicatedClass(classDTO),
      this.hasSameRoom(classDTO)
    ])
    DateHelper.ValidateTimeRange(classDTO.startTime, classDTO.endTime)
    DateHelper.FromDateToDateValidator(classDTO.fromDate, classDTO.toDate)
    const toDate = new Date(classDTO.toDate)
    toDate.setDate(toDate.getDate() + 1)

    return await this.prismaSv.khoaHoc.update({
      where: { ID: classDTO.courseId },
      data: {
        TrangThai: 'ACTIVE',
        lophoc: {
          create: {
            MaLopHoc: classDTO.code,
            TenLop: classDTO.name,
            GiaoVienID: classDTO.teacherId,
            TuNgay: classDTO.fromDate,
            DenNgay: toDate,
            LichHoc: classDTO.timeTable,
            GioBatDau: classDTO.startTime,
            GioKetThuc: classDTO.endTime,
            SiSo: classDTO.classSize,
            PhongHoc: classDTO.room
          }
        }
      }
    })
  }

  // lấy danh sách lớp mặc định hoặc query
  async getMany(query: QueryClassDTO) {
    const where: Prisma.LopHocWhereInput = {}
    if (query.status) where.TrangThai = query.status
    const q = query?.q?.trim()
    if (q) {// nếu có câu truy vấn như tìm tên lớp, mã lớp, tên giáo viên,..
      where.OR = [
        { MaLopHoc: { contains: q, mode: 'insensitive' } },
        { TenLop: { contains: q, mode: 'insensitive' } },
        { giaovien: { User: { HoTen: { contains: q, mode: 'insensitive' } } } }
      ]
    }
    const classDB = await this.prismaSv.lopHoc.findMany({
      where,
      include: classIncludeTeacher,
      orderBy: { ID: 'desc' },
      omit: { CreatedAt: true, UpdatedAt: true }
    })

    return classDB.map(lh => {
      const { giaovien, khoahoc, GioBatDau, GioKetThuc, _count, ...rest } = lh
      return {
        ...rest,
        ...khoahoc,
        GiaoVien: giaovien.User.HoTen,
        SoBuoiDaHoc: _count.buoihoc,
        GioHoc: GioBatDau + ' - ' + GioKetThuc,
        TongGhiDanh: _count.ghidanh,
      }
    })
  }

  // lấy danh sách lớp cho combobox
  async getManyForCmb() {
    const classDB = await this.prismaSv.lopHoc.findMany({
      where: { TrangThai: { not: 'CLOSED' } },
      include: classInclude,
      orderBy: { MaLopHoc: 'asc' }
    })
    return classDB.map(m => ({
      ID: m.ID, TenLop: m.TenLop, MaLopHoc: m.MaLopHoc,
      LichHoc: m.LichHoc, HocPhi: m.khoahoc.HocPhi,
      GioHoc: m.GioBatDau + " - " + m.GioKetThuc,
      TongGhiDanh: m._count.ghidanh, SiSo: m.SiSo
    }))
  }

  // lấy chi tiết lớp - phần trên
  async getOne(classId: number, userId: number | null) {
    const where: LopHocWhereUniqueInput = { ID: classId }
    if (userId) // là giáo viên thì lấy lớp giáo viên
      where.giaovien = { UserID: userId }

    const classDB = await this.prismaSv.lopHoc.findUnique({
      where: where,
      include: classIncludeTeacher, // include bên file khác
      omit: { CreatedAt: true, UpdatedAt: true }
    })
    if (!classDB) throw new ForbiddenException
      ('Không tìm thấy lớp học hoặc truy cập bị từ chối')
    const { giaovien, khoahoc, GioBatDau, GioKetThuc, _count, ...rest } = classDB
    return {
      ...rest,
      ...khoahoc,
      GiaoVien: giaovien.User.HoTen,
      SoBuoiDaHoc: _count.buoihoc,
      GioHoc: GioBatDau + ' - ' + GioKetThuc,
      TongGhiDanh: _count.ghidanh,
    }
  }

  // lấy danh sách học viên của lớp
  async getStusById(classId: number) {
    const classDB = await this.idValidator(classId)
    const enrolls = await this.prismaSv.ghiDanh.findMany({
      where: { LopHocID: classDB.ID, TrangThai: 'ACTIVE' },
      include: {
        hocvien: {
          include: { Parent: { select: { HoTen: true, DienThoai: true } } },
          omit: { CreatedAt: true, UpdatedAt: true, TrangThai: true }
        },
      },
      orderBy: { hocvien: { TenHocVien: 'asc' } }
    })
    return enrolls.map(stu => {
      const { hocvien, ...rest } = stu
      const { ID, Parent, ...restStu } = hocvien
      return {
        HocVienID: ID,
        ...restStu,
        NgayNhapHoc: rest.NgayGhiDanh,
        PhuHuynh: Parent.HoTen,
        DienThoai: Parent.DienThoai,
      }
    })
  }

  // cập nhật lớp theo trạng thái
  async updateById(classId: number, up: UpdateClassDTO) {
    const classDB = await this.idValidator(classId)
    // đếm buổi học của lớp
    const countSession = await this.prismaSv.buoiHoc.count({
      where: { LopHocID: classDB.ID, TrangThai: { not: 'CANCELLED' } }
    })
    const timeFields = ['fromDate', 'toDate', 'timeTable', 'startTime', 'endTime']
    const hasTimeField = timeFields.some(key => up[key] !== undefined)
    if ( // Lớp RUNNING || OPEN có buổi học
      (classDB.TrangThai === 'RUNNING' ||
        (classDB.TrangThai === 'OPEN' && countSession > 0)) &&
      hasTimeField// có dính key của timeFields
    ) {
      throw new BadRequestException
        ('Không được thay đổi thông tin ảnh hưởng đến thời gian học')
    }

    const merged: UpdateClassDTO = {
      name: up.name ?? classDB.TenLop,
      description: up.description ?? classDB.MoTa ?? undefined, // nếu 2 ông đầu null/undefined thì undefined
      classSize: up.classSize ?? classDB.SiSo,
      fromDate: up.fromDate ?? classDB.TuNgay,
      toDate: up.toDate ?? classDB.DenNgay,
      timeTable: up.timeTable ?? classDB.LichHoc,
      startTime: up.startTime ?? classDB.GioBatDau,
      endTime: up.endTime ?? classDB.GioKetThuc,
      room: up.room ?? classDB.PhongHoc ?? undefined
    }

    // nếu đổi phòng thì kiểm tra phòng có trống không
    if (up.room !== undefined) {
      await this.hasSameRoom(merged, classDB.ID)
    }

    DateHelper.FromDateToDateValidator(merged.fromDate!, merged.toDate!)
    DateHelper.ValidateTimeRange(merged.startTime!, merged.endTime!)

    return await this.prismaSv.lopHoc.update({
      where: { ID: classDB.ID },
      data: {
        TenLop: merged.name, MoTa: merged.description, SiSo: merged.classSize,
        TuNgay: merged.fromDate, DenNgay: merged.toDate, LichHoc: merged.timeTable,
        GioBatDau: merged.startTime, GioKetThuc: merged.endTime, PhongHoc: merged.room,

        ...(up.room !== undefined && {// có gửi phòng học thì update
          buoihoc: {
            updateMany: {
              where: { TrangThai: 'SCHEDULED' },
              data: { PhongHoc: up.room } // dùng của up để luôn lấy giá trị mới
            } // giá trị của merged có thể là cũ -> update không cần thiết
          }
        })
      }
    })
  }

  // xóa mềm lớp học và hủy các buổi học chưa diễn ra
  async deleteById(classId: number) {
    const classDB = await this.idValidator(classId)
    return await this.prismaSv.lopHoc.update({
      where: { ID: classDB.ID },
      data: {
        TrangThai: 'CLOSED',
        buoihoc: {
          updateMany: { // chỉ update những buổi chưa học
            where: { TrangThai: 'SCHEDULED' },
            data: { TrangThai: 'CANCELLED' }
          }
        }
      }
    })
  }

  // lấy danh sách lớp theo giáo viên - userId
  async getManyByUserId(userId: number) {
    const teacherDB = await this.prismaSv.giaoVien.findUnique({
      where: { UserID: userId }
    })
    if (!teacherDB) throw new NotFoundException('Không tìm thấy giáo viên')
    const classDB = await this.prismaSv.lopHoc.findMany({
      where: { GiaoVienID: teacherDB.ID },
      include: classInclude,
      omit: { CreatedAt: true, UpdatedAt: true },
      orderBy: { CreatedAt: 'desc' }
    })
    if (classDB.length == 0) return []
    return classDB.map(lh => {
      const { _count, khoahoc, ...rest } = lh
      return {
        ...rest,
        GioHoc: rest.GioBatDau + ' - ' + rest.GioKetThuc,
        TongGhiDanh: _count.ghidanh,
        TongSoBuoi: khoahoc.TongSoBuoi,
        SoBuoiDaHoc: _count.buoihoc
      }
    })
  }

  //kiểm tra trùng mã lớp 
  private async codeValidator(code: string) {
    const classDB = await this.prismaSv.lopHoc.findFirst({
      where: { MaLopHoc: code }
    })
    if (classDB) throw new ConflictException('Mã lớp đã được sử dụng')
    return classDB
  }

  // kiểm tra id lớp
  private async idValidator(classId: number) {
    const classDB = await this.prismaSv.lopHoc.findUnique({
      where: { ID: classId }
    })
    if (!classDB) throw new NotFoundException('Không tìm thấy lớp học')
    return classDB
  }

  //kiểm tra id khóa học 
  private async courseIdValidator(courseId: number) {
    const courseDB = await this.prismaSv.khoaHoc.findUnique({
      where: { ID: courseId }
    })
    if (!courseDB)// nếu không tồn tại khóa học
      throw new NotFoundException('Không tìm thấy khóa học')
    if (courseDB.TrangThai === 'INACTIVE')
      throw new ConflictException('Khóa học này tạm thời không thể mở lớp')
    return courseDB
  }

  //kiểm tra id giáo viên
  private async teacherIdValidator(teacherId: number) {
    const teacherDB = await this.prismaSv.giaoVien.findUnique({
      where: { ID: teacherId }
    })
    if (!teacherDB)
      throw new NotFoundException('Không tìm thấy giáo viên')
    if (teacherDB.TrangThai === 'INACTIVE')
      throw new ConflictException('Giáo viên đã nghỉ')
    return teacherDB
  }

  //kiểm tra giáo viên có trùng lịch dạy lớp học
  private async duplicatedClass(body: CreateClassDTO, excludeClassId?: number) {
    const { teacherId, room, fromDate, toDate,
      timeTable, startTime, endTime } = body

    const where: Prisma.LopHocWhereInput = {
      TrangThai: { not: 'CLOSED' }
    }
    if (teacherId) {
      const teacherDB = await this.teacherIdValidator(teacherId)
      where.GiaoVienID = teacherDB.ID
    }
    if (excludeClassId) where.ID = { not: excludeClassId }
    if (room) where.PhongHoc = room
    // tìm lớp học đầu tiên bị trùng
    const conflict = await this.prismaSv.lopHoc.findFirst({
      where: {
        ...where,
        TuNgay: { lte: toDate }, // <= ngày so sánh
        DenNgay: { gte: fromDate }, // >= ngày ss
        LichHoc: { hasSome: timeTable }, // có thứ trùng lịch
        GioBatDau: { lte: startTime }, // <= giờ ngày ss
        GioKetThuc: { gte: endTime },
      },
    })
    if (conflict)
      throw new ConflictException
        (`Giáo viên trùng lịch dạy với lớp "${conflict.TenLop}' - ${conflict.MaLopHoc}`)
  }

  // kiểm tra trùng phòng lớp
  private async hasSameRoom(body: UpdateClassDTO | CreateClassDTO,
    excludeClassId?: number) {
    if (!body.room) return

    const { fromDate, toDate, timeTable, startTime, endTime } = body
    const conflict = await this.prismaSv.lopHoc.findFirst({
      where: {
        TrangThai: { not: 'CLOSED' },
        PhongHoc: body.room,// trùng phòng
        TuNgay: { lte: toDate }, // <= ngày ss
        DenNgay: { gte: fromDate }, // >= ngày ss
        LichHoc: { hasSome: timeTable }, // có thứ trong lịch
        GioBatDau: { lte: endTime }, // <= giờ ngày ss
        GioKetThuc: { gte: startTime },
        ID: excludeClassId ? { not: excludeClassId } : undefined
      }
    })
    if (conflict)
      throw new BadRequestException
        (`Phòng ${body.room} đã được sử dụng bởi lớp '${conflict.TenLop}' - ${conflict.MaLopHoc} `)
  }
}

// Object.keys(this).reduce((prev, curr) =>
//     this[curr] !== undefined ? { ...prev, [curr]: this[curr] } : prev, {})

// const b = Object.keys(a).reduce((acc:any,key)=>{
//     const k = key as keyof typeof a
//     if(a[k] !== undefined)
//         acc[k] = a[k]
//     return acc
// },{} )