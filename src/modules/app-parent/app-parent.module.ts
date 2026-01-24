import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { AppParentService } from "./app-parent.service";
import { AppParentController } from "./app-parent.controller";

@Module({
    imports:[PrismaModule],
    controllers:[AppParentController],
    providers:[AppParentService]
})
export class AppParentModule{}