import { Module } from '@nestjs/common';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { ClassModule } from '../class/class.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [ClassModule, PrismaModule],
  controllers: [CourseController],
  providers: [CourseService],
})
export class CourseModule {}
