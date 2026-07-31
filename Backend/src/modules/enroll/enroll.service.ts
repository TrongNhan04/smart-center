import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEnrollDTO, QueryEnrollDTO } from './enroll.dto';
import { InvoiceService } from '../invoice/invoice.service';
import { NotifyService } from '../notify/notify.service';

@Injectable()
export class EnrollService {
  constructor(
    private prismaSv: PrismaService,
    private invoiceService: InvoiceService,
    private notisService: NotifyService,
  ) {}

  // tạo ghi danh tự động
  async createTx(
    studentId: number,
    classId: number,
    tx: Prisma.TransactionClient,
  ) {
    const today = new Date();
    let client: Prisma.TransactionClient | null = null;
    if (tx) client = tx;
    else client = this.prismaSv;
    return await client.ghiDanh.create({
      data: {
        LopHocID: classId,
        HocVienID: studentId,
        NgayGhiDanh: today,
      },
      omit: { UpdatedAt: true, CreatedAt: true },
    });
  }

  //tạo ghi danh thủ công + hóa đơn + thông báo
  async create(body: CreateEnrollDTO) {
    const classDB = await this.classIdValidator(body.classId);
    const studentDB = await this.studentIdValidator(body.studentId);
    await this.enrollValidator(studentDB.ID, classDB.ID);
    await this.TotalSlot(classDB.ID);
    const data = await this.prismaSv.$transaction(async (tx) => {
      const newEnroll = await tx.ghiDanh.create({
        data: {
          HocVienID: studentDB.ID,
          LopHocID: classDB.ID,
          NgayGhiDanh: new Date(),
        },
      });
      // thêm hóa đơn
      return await this.invoiceService.createTx(
        studentDB.ID,
        newEnroll.ID,
        classDB.DenNgay,
        body.fee,
        tx,
      );
    });
    // thêm thông báo
    const payload = {
      ThoiHan: data.ThoiHan,
      TenLop: classDB.TenLop,
      TongTien: data.TongTien,
      HoaDonId: data.ID,
      HocVienId: studentDB.ID,
      LopHocId: classDB.ID,
    };
    await this.notisService.createInvoiceNotify(studentDB.UserID, payload);
    return { ID: data.GhiDanhID };
  }

  // danh sách ghi danh, bộ lọc trạng thái, tìm kiếm theo từ khóa
  async getMany(query: QueryEnrollDTO) {
    const where: Prisma.GhiDanhWhereInput = {};
    const q = query.q?.trim();

    if (query.status) where.TrangThai = query.status;

    if (q) {
      where.OR = [
        { lophoc: { TenLop: { contains: q, mode: 'insensitive' } } },
        { hocvien: { TenHocVien: { contains: q, mode: 'insensitive' } } },
        { hocvien: { MaHocVien: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const enrollDB = await this.prismaSv.ghiDanh.findMany({
      where,
      include: {
        lophoc: { select: { TenLop: true } },
        hocvien: {
          select: {
            TenHocVien: true,
            MaHocVien: true,
          },
        },
      },
      omit: { CreatedAt: true, UpdatedAt: true },
      orderBy: { NgayGhiDanh: 'desc' },
    });
    return enrollDB.map((item) => {
      const { lophoc, hocvien, ...rest } = item;
      return {
        ...rest,
        ...lophoc,
        ...hocvien,
      };
    });
  }

  // xóa mềm ghi danh + xóa mềm hóa đơn
  async deleteById(enrollId: number) {
    const enrollDB = await this.prismaSv.ghiDanh.findUnique({
      where: { ID: enrollId },
      include: { hoadon: true },
    });
    if (!enrollDB) throw new NotFoundException('Không tìm thấy ghi danh');
    if (!enrollDB.hoadon)
      throw new ConflictException('Không tìm thấy hóa đơn của ghi danh');

    return await this.prismaSv.ghiDanh.update({
      where: { ID: enrollDB.ID },
      data: {
        TrangThai: 'INACTIVE',
        hoadon: {
          update: { TrangThai: 'CANCELLED' },
        },
      },
    });
  }

  // lấy danh sách ghi danh ACTIVE theo lớp
  async getManyByClassId(classId: number) {
    const enrolls = await this.prismaSv.ghiDanh.findMany({
      where: { LopHocID: classId, TrangThai: 'ACTIVE' },
      select: {
        hocvien: {
          select: {
            MaHocVien: true,
            TenHocVien: true,
            Parent: { select: { Email: true, DienThoai: true, HoTen: true } },
          },
        },
      },
    });
    return enrolls.map((item) => {
      const { hocvien } = item;
      const { Parent, ...rest } = hocvien;
      return {
        ...rest,
        TenPhuHuynh: Parent.HoTen,
        ...Parent,
      };
    });
  }

  // kiểm tra slot lớp
  async TotalSlot(classId: number) {
    const classDB = await this.classIdValidator(classId);

    const totolEnroll = await this.prismaSv.ghiDanh.count({
      where: { LopHocID: classDB.ID, TrangThai: 'ACTIVE' },
    });

    if (totolEnroll == classDB.SiSo) throw new ConflictException('Lớp đã đầy');
  }

  // kiểm tra 1 học viên ghi danh 1 lớp 1 lần
  private async enrollValidator(studentId: number, classId: number) {
    const existed = await this.prismaSv.ghiDanh.findFirst({
      where: {
        LopHocID: classId,
        HocVienID: studentId,
        TrangThai: 'ACTIVE',
      },
    });
    if (existed)
      throw new ConflictException(
        `Học viên đã ghi danh vào lớp ngày ${existed.NgayGhiDanh.toLocaleDateString()}`,
      );
  }

  // kiểm tra id lớp
  private async classIdValidator(classId: number) {
    const classDB = await this.prismaSv.lopHoc.findUnique({
      where: { ID: classId },
    });
    if (!classDB) throw new ConflictException('Không tìm thấy lớp học');
    if (classDB.TrangThai === 'CLOSED')
      throw new ConflictException('Lớp đã đóng!');
    return classDB;
  }

  //kiểm tra id học viên
  private async studentIdValidator(studentId: number) {
    const studentDB = await this.prismaSv.hocVien.findUnique({
      where: { ID: studentId },
    });
    if (!studentDB) throw new NotFoundException('Không tìm thấy học viên');
    if (studentDB.TrangThai === 'INACTIVE')
      throw new ConflictException('Học viên đã nghỉ học');
    return studentDB;
  }
}
