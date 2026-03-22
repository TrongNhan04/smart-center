import { Injectable, NotFoundException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response';
import { PrismaService } from 'src/prisma/prisma.service';
const streamifier = require('streamifier')

@Injectable()
export class CloudinaryService {
    constructor(private prisma: PrismaService) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        })
    }

    // up 1 file
    uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
        return new Promise<CloudinaryResponse>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'smart-center', resource_type:'auto' },
                (error, result) => {
                    if (error) return reject(error)
                    if (!result) return reject(new Error('Upload thất bại'))
                    resolve(result) // trả về thông tin trên cloudinary
                }
            )

            streamifier.createReadStream(file.buffer).pipe(uploadStream)
        })
    }

    // up nhiều file, hàm trả về promise, nên không cần async/await
    uploadMultiple(files: Express.Multer.File[]): Promise<CloudinaryResponse[]> {
        if (!files || files.length === 0) return Promise.resolve([])
        const multipleFile = files.map(file => this.uploadFile(file))
        return Promise.all(multipleFile)
    }

    // lấy tệp đính kèm buổi học
    async findBySessionId(sessionId: number) {
        const sessionDB = await this.prisma.buoiHoc.findUnique({
            where: { ID: sessionId },
            include: { ketqua_buoihoc: true }
        })
        if (!sessionDB) throw new NotFoundException('Không tìm thấy buổi học')
        if (!sessionDB.ketqua_buoihoc) return [] // buổi học chưa có kết quả
        return await this.prisma.tepDinhKem_BuoiHoc.findMany({
            where: { KQBuoiHocID: sessionDB.ketqua_buoihoc.ID },
            omit: { CreatedAt: true, UpdatedAt: true }
        })
    }
}
