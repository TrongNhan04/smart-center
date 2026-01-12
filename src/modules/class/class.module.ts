import { Module } from "@nestjs/common";
import { ClassController } from "./class.controller";
import { ClassService } from "./class.service";
import { PrismaService } from "src/prisma/prisma.service";
import { SessionModule } from "../session/session.module";

@Module({
  imports:[SessionModule],
  controllers: [ClassController],
  providers: [ClassService, PrismaService],
  exports:[ClassService]
})
export class ClassModule {}