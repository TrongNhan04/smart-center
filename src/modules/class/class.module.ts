import { Module } from "@nestjs/common";
import { ClassController } from "./class.controller";
import { ClassService } from "./class.service";
import { SessionModule } from "../session/session.module";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
  imports:[SessionModule, PrismaModule],
  controllers: [ClassController],
  providers: [ClassService],
  exports:[ClassService]
})
export class ClassModule {}