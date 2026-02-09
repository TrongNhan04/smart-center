import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { TeacherModule } from './modules/teacher/teacher.module';
import { ConfigModule } from '@nestjs/config';
import { ClassModule } from './modules/class/class.module';
import { CourseModule } from './modules/course/course.module';
import { SessionModule } from './modules/session/session.module';
import { StudentModule } from './modules/student/student.module';
import { EnrollModule } from './modules/enroll/enroll.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AppParentModule } from './modules/app-parent/app-parent.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/transform.interceptor';

@Module({
  imports: [// thiếu NotifyModule
    AuthModule, PrismaModule, TeacherModule, 
    ConfigModule.forRoot({isGlobal:true}), CourseModule, 
    ClassModule, SessionModule, StudentModule, EnrollModule, 
    InvoiceModule, DashboardModule, AppParentModule
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ]
})
export class AppModule {}
