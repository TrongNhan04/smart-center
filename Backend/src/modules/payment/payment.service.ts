import { Injectable, NotFoundException } from '@nestjs/common';
import { createPaymentDto } from './payment.dto';
import { PayOS } from '@payos/node';
import { PrismaService } from 'src/prisma/prisma.service';
import { DateHelper } from 'src/common/date.helper';
import { EventGateway } from '../event/event.gateway';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentService {
  private payOS: PayOS;

  constructor(
    private readonly primaSv: PrismaService,
    private readonly eventGateway: EventGateway,
    private readonly configSv: ConfigService,
  ) {
    this.payOS = new PayOS({
      clientId: this.configSv.get<string>('PAYOS_CLIENT_ID'),
      apiKey: this.configSv.get<string>('PAYOS_API_KEY'),
      checksumKey: this.configSv.get<string>('PAYOS_CHECKSUM_KEY'),
    });
  }

  // tạo link thanh toán
  async createPaymentLink(body: createPaymentDto) {
    const hoaDonId = Number(body.orderId);
    const invoiceDB = await this.primaSv.hoaDon.findUnique({
      where: { ID: hoaDonId },
      include: { hocvien: { select: { TenHocVien: true } } },
    });
    if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn');
    const conNo = Number(invoiceDB.TongTien) - Number(invoiceDB.DaTra);
    // hết hạn sau 30 phút
    const expiredAt = Math.floor(Date.now() / 1000 + 30 * 60);
    // tạo code từ id hóa đơn và 6 số cuối ở thời điểm hiện tại
    const orderCode = DateHelper.CreateUniqueCode(body.orderId);
    const paymentData = {
      orderCode: Number(orderCode),
      amount: conNo,
      description: `THANH TOAN HOC PHI`,
      cancelUrl: 'https://my-smart-center.com/cancel',
      returnUrl: 'https://my-smart-center.com/success',
      expiredAt: expiredAt,
    };
    const paymentRes = await this.payOS.paymentRequests.create(paymentData);
    return {
      orderCode: paymentRes.orderCode,
      amount: paymentRes.amount,
      checkoutUrl: paymentRes.checkoutUrl,
      qrCode: paymentRes.qrCode,
    };
  }

  async handleWebhook(body: any) {
    try {
      const webhookData = await this.payOS.webhooks.verify(body);
      if (webhookData.code === '00') {
        // thành công
        console.log('Thanh toán thành công:', webhookData);
        // cắt bỏ 6 số cuối để lấy id
        const inStr = webhookData.orderCode.toString().slice(0, -6);
        const invoiceId = Number(inStr);
        const amount = webhookData.amount;

        await this.primaSv.hoaDon.update({
          where: { ID: invoiceId },
          data: {
            DaTra: { increment: amount },
            giaodich: {
              create: {
                MaGiaoDich: DateHelper.CreateUniqueCode('MGD'),
                LoaiGiaoDich: 'RECEIPT',
                SoTien: amount,
                NgayGiaoDich: new Date(),
                PhuongThuc: 'TRANSFER',
              },
            },
          },
        });

        this.eventGateway.server.emit(`PAYMENT_SUCCESS_${invoiceId}`, {
          message: 'Thành công',
          amount: amount,
        });
      }
      return { success: true };
    } catch (error) {
      console.error('Webhook không hợp lệ:', error);
      throw new Error('Invalid webhook');
    }
  }
}
