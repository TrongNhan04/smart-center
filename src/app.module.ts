import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { TeacherModule } from './modules/teacher/teacher.module';
import { ConfigModule } from '@nestjs/config';
import { ClassModule } from './modules/class/class.module';
import { CourseModule } from './modules/course/course.module';
import { SessionModule } from './modules/session/session.module';
import { StudentModule } from './modules/student/student.module';
import { EnrollModule } from './modules/enroll/enroll.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { PaymentModule } from './modules/payment/payment.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';


@Module({
  imports: [// thiếu NotifyModule
    AuthModule, UserModule, PrismaModule, 
    TeacherModule, ConfigModule.forRoot({isGlobal:true}),
    CourseModule, ClassModule, SessionModule, StudentModule,
    EnrollModule, InvoiceModule, PaymentModule, DashboardModule
  ]
})
export class AppModule {}
