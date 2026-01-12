import { Module } from "@nestjs/common";
import { CourseController } from "./course.controller";
import { CourseService } from "./course.service";
import { PrismaService } from "src/prisma/prisma.service";
import { ClassModule } from "../class/class.module";

@Module({
  imports:[ClassModule],
  controllers: [CourseController],
  providers: [CourseService, PrismaService],
})
export class CourseModule {}