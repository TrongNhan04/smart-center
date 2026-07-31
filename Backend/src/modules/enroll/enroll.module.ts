import { Module } from '@nestjs/common';
import { EnrollService } from './enroll.service';
import { EnrollController } from './enroll.controller';
import { InvoiceModule } from '../invoice/invoice.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotifyModule } from '../notify/notify.module';

@Module({
  imports: [InvoiceModule, PrismaModule, NotifyModule],
  controllers: [EnrollController],
  providers: [EnrollService],
  exports: [EnrollService],
})
export class EnrollModule {}
