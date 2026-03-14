import { Controller, Post, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { CloudinaryService } from "./cloudinary.service";
import { FilesInterceptor } from "@nestjs/platform-express";

@Controller()
export class CloudinaryController {
    constructor(private cloudinaryService: CloudinaryService) { }

    @Post('api/file-upload')
    @UseInterceptors(FilesInterceptor('file')) // bắt cái file, có s
    async uploadFile(@UploadedFiles() files: Express.Multer.File[]) {
        // upload nhiều file
        //const arrRes = await this.cloudinaryService.uploadMultiple(files)
        // return arrRes.map(item=>({
        //     public_id: item.public_id,
        //     secure_url: item.secure_url
        // }))
        const res = await this.cloudinaryService.uploadFile(files[0])
        return {
            public_id: res.public_id,
            secure_url: res.secure_url
        }
    }
}