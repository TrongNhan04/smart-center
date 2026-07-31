import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { SharedJWTModule } from 'src/common/share-jwt.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [SharedJWTModule, PrismaModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
