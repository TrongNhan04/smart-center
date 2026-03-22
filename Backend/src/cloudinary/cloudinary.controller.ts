import { Body, Controller, Get, Param, Post, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { CloudinaryService } from "./cloudinary.service";
import { FilesInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { MustChangePWGuard } from "src/auth/guard/must-change-pw.guard";

@Controller()
export class CloudinaryController {
    constructor(private cloudinaryService: CloudinaryService) { }

    @UseGuards(JwtAuthGuard,MustChangePWGuard,RolesGuard)
    @Roles('ADMIN','TEACHER')
    @Post('api/file-upload')
    @UseInterceptors(FilesInterceptor('file', 10, {
        limits:{
            fileSize: 5 * 1024 * 1024 // 5mb mỗi file
        }
    })) // bắt cái file, có s
    async uploadFile(@UploadedFiles() files: Express.Multer.File[]) {
        // upload nhiều file
        // const arrRes = await this.cloudinaryService.uploadMultiple(files)
        // return arrRes.map(item=>({
        //     public_id: item.public_id,
        //     secure_url: item.secure_url,
        //     resource_type: item.resource_type
        // }))
        const res =  await this.cloudinaryService.uploadFile(files[0])
        return {
            public_id: res.public_id,
            url: res.secure_url,
            resource_type: res.resource_type
        }
    }

    // tìm tệp đính kèm buổi học
    @UseGuards(JwtAuthGuard, MustChangePWGuard,RolesGuard)
    @Roles('ADMIN','TEACHER','PARENT')
    @Get('api/sessions/:id/file-upload')
    async findBySessionId (@Param('id') sessionId:number){
        return await this.cloudinaryService.findBySessionId(+sessionId)
    }
}