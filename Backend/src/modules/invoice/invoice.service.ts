import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import {
  CreateTransactionDTO,
  QueryInvoiceDTO,
  QueryTransaction,
} from './invoice.dto';
import { NotifyService } from '../notify/notify.service';
import { GiaoDichWhereInput } from 'src/generated/prisma/models';
import { DateHelper } from 'src/common/date.helper';
import { InvoiceIncludeStu_Eroll } from './invoice.include';

@Injectable()
export class InvoiceService {
  constructor(
    private prismaSv: PrismaService,
    private notisService: NotifyService,
  ) {}

  //kiểm tra id hóa đơn
  private async invoiceIdValidator(invoiceId: number) {
    const invoiceDB = this.prismaSv.hoaDon.findUnique({
      where: { ID: invoiceId },
    });
    if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn');
    return invoiceDB;
  }

  // tạo hóa đơn tự động
  async createTx(
    studentId: number,
    enrollId: number,
    dueDate: Date,
    total: number,
    tx: Prisma.TransactionClient,
  ) {
    let client: Prisma.TransactionClient | null = null;
    if (tx) client = tx;
    else client = this.prismaSv;
    return await client.hoaDon.create({
      data: {
        HocVienID: studentId,
        GhiDanhID: enrollId,
        MaHoaDon: DateHelper.CreateUniqueCode('HD'),
        ThoiHan: dueDate,
        TongTien: total,
      },
    });
  }

  // lấy chi tiết hóa đơn
  async getOne(invoiceId: number) {
    const invoiceDB = await this.prismaSv.hoaDon.findUnique({
      where: { ID: invoiceId },
      include: InvoiceIncludeStu_Eroll,
      omit: { UpdatedAt: true },
    });
    if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn');
    return this.FormatedInv(invoiceDB);
  }

  private FormatedInv = (invoiceDB: any) => {
    const { ghidanh, hocvien, CreatedAt, ThoiHan, ...restInv } = invoiceDB;
    return {
      ...restInv,
      TenLop: ghidanh.lophoc.TenLop ?? null,
      TenHocVien: hocvien.TenHocVien,
      DienThoai: hocvien.Parent.DienThoai,
      NgayPhatHanh: CreatedAt, //
      NgayHetHan: ThoiHan, //
    };
  };

  // lấy danh sách hóa đơn + tìm kiếm
  async getMany(query: QueryInvoiceDTO) {
    const take = 12;
    const skip = (query.page - 1) * take || 0;
    const where: Prisma.HoaDonWhereInput = {};

    const q = query.q?.trim();
    if (query.status) where.TrangThai = query.status;
    if (q) {
      where.OR = [
        { MaHoaDon: { contains: q, mode: 'insensitive' } },
        { hocvien: { TenHocVien: { contains: q, mode: 'insensitive' } } },
      ];
    }
    const [total, invoiceDB] = await Promise.all([
      this.prismaSv.hoaDon.count({ where }),
      this.prismaSv.hoaDon.findMany({
        where,
        include: InvoiceIncludeStu_Eroll,
        take: take,
        skip: skip,
        orderBy: { CreatedAt: 'desc' },
        omit: { UpdatedAt: true },
      }),
    ]);

    const mapData = invoiceDB.map((item) => this.FormatedInv(item));
    return {
      total: total,
      items: mapData,
    };
  }

  //thêm giao dịch thu tiền theo hóa đơn id
  async createReceipt(
    userId: number,
    invoiceId: number,
    body: CreateTransactionDTO,
  ) {
    const invoiceDB = await this.prismaSv.hoaDon.findUnique({
      where: { ID: invoiceId },
      include: { hocvien: { select: { UserID: true } } },
    });
    if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn');
    if (invoiceDB.TrangThai === 'CANCELLED')
      throw new BadRequestException('Hóa đơn đã hủy, không thể thu tiền!');

    const remain = Number(invoiceDB.TongTien) - Number(invoiceDB.DaTra);
    if (body.amount > remain)
      throw new BadRequestException(
        `Số tiền thu không được vượt quá ${remain} đ`,
      );

    const data = await this.prismaSv.$transaction(async (tx) => {
      const newReceipt = await tx.giaoDich.create({
        data: {
          UserID: userId,
          HoaDonID: invoiceDB.ID,
          MaGiaoDich: DateHelper.CreateUniqueCode('MGD'),
          LoaiGiaoDich: 'RECEIPT',
          NgayGiaoDich: new Date(),
          SoTien: body.amount,
          PhuongThuc: body.method,
          GhiChu: body.note,
        },
      });

      await tx.hoaDon.update({
        where: { ID: invoiceId },
        data: { DaTra: { increment: body.amount } },
      });
      return newReceipt;
    });
    const receipt = {
      ID: data.ID,
      HoaDonID: invoiceDB.ID,
      SoTien: body.amount,
      HocVienid: invoiceDB.HocVienID,
    };
    await this.notisService.createReceiptNotify(userId, receipt);
  }

  // thêm giao dịch chi tiền theo hóa đơn id
  async createPayment(
    userId: number,
    invoiceId: number,
    body: CreateTransactionDTO,
  ) {
    const reason = body.note?.trim() || null;
    const invoiceDB = await this.prismaSv.hoaDon.findUnique({
      where: { ID: invoiceId },
    });
    if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn');

    if (invoiceDB.TrangThai === 'ACTIVE')
      throw new ConflictException(
        'Hóa đơn vẫn còn hiệu thực, không thể tạo phiếu hoàn tiền',
      );

    const daTra = Number(invoiceDB.DaTra);
    if (daTra == 0)
      throw new BadRequestException(
        'Hóa đơn chưa thanh toán, không cần tạo phiếu hoàn tiền',
      );

    if (body.amount > daTra)
      throw new BadRequestException(
        'Số tiền hoàn phải nhỏ hơn hoặc bằng số tiền đã trả',
      );

    return await this.prismaSv.hoaDon.update({
      where: { ID: invoiceDB.ID },
      data: {
        DaTra: { decrement: body.amount },
        giaodich: {
          create: {
            UserID: userId,
            MaGiaoDich: DateHelper.CreateUniqueCode('MGD'),
            LoaiGiaoDich: 'PAYMENT',
            NgayGiaoDich: new Date(),
            SoTien: body.amount,
            PhuongThuc: body.method,
            GhiChu: reason,
          },
        },
      },
    });
  }

  // lấy danh sách giao dịch theo id hóa đơn
  async getTransactionsById(invoiceId: number) {
    const invoiceDB = await this.invoiceIdValidator(invoiceId);
    if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn');

    const receiptDB = await this.prismaSv.giaoDich.findMany({
      where: { HoaDonID: invoiceDB.ID },
      include: { user: { select: { HoTen: true } } },
      orderBy: { NgayGiaoDich: 'asc' },
      omit: { CreatedAt: true, UpdatedAt: true },
    });
    return receiptDB.map((item) => {
      const { user, ...rest } = item;
      return {
        ...rest,
        ThuNgan: user?.HoTen,
      };
    });
  }

  // lấy toàn bộ giao dịch theo tháng - năm + phân trang
  async getTransactions(query: QueryTransaction) {
    const take = 10;
    const skip = (query.page - 1) * take || 0;

    const now = new Date();
    const m = query.month ?? now.getMonth();
    const y = query.year ?? now.getFullYear();

    const { start, end } = DateHelper.GetStartEndOfMonth(new Date(y, m));
    const where: GiaoDichWhereInput = {
      NgayGiaoDich: { gte: start, lt: end },
    };

    const [total, items] = await Promise.all([
      this.prismaSv.giaoDich.count({ where: where }),
      this.prismaSv.giaoDich.findMany({
        where: where,
        include: {
          user: { select: { HoTen: true } },
          hoadon: { select: { hocvien: { select: { TenHocVien: true } } } },
        },
        take: take,
        skip: skip,
      }),
    ]);

    const flatItems = items.map((item) => {
      const { user, hoadon, ...rest } = item;
      return {
        ...rest,
        ThuNgan: user?.HoTen || null,
        TenHocVien: hoadon?.hocvien.TenHocVien || null,
      };
    });
    return {
      total: total,
      items: flatItems,
    };
  }
}
