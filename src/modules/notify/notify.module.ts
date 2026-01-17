import { Module } from "@nestjs/common";
import { NotifyController } from "./notify.controller";
import { NotifyService } from "./notify.service";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
    imports:[PrismaModule],
    controllers:[NotifyController],
    providers:[NotifyService],
    exports:[NotifyService]
})
export class NotifyModule{}