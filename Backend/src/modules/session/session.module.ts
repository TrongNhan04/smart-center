import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotifyModule } from '../notify/notify.module';
import { SessionResultService } from '../session-result/session-result.service';

@Module({
  imports: [PrismaModule, NotifyModule],
  controllers: [SessionController],
  providers: [SessionService, SessionResultService],
  exports: [SessionService],
})
export class SessionModule {}
