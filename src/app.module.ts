import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { TeacherModule } from './modules/teacher/teacher.module';
import { ConfigModule } from '@nestjs/config';
import { ClassModule } from './modules/class/class.module';
import { CourseModule } from './modules/course/course.module';


@Module({
  imports: [
    AuthModule, UserModule, PrismaModule, 
    TeacherModule, ConfigModule.forRoot({isGlobal:true}),
    CourseModule, ClassModule
  ]
})
export class AppModule {}
