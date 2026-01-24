import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AppParentService } from "./app-parent.service";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { MustChangePWGuard } from "src/auth/guard/must-change-pw.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { Request } from 'express';

type RequestWithUser = Request & { user: { userId: number; role?: string } };

@UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
@Roles('ADMIN','PARENT','TEACHER')
@Controller('parents')
export class AppParentController {
    constructor(
        private appParent: AppParentService
    ){}

    // đăng nhập - auth service
    // đổi tên | mật khẩu - auth service
    // đăng xuất - auth service

    // lấy thông tin tài khoản + danh sách con
    @Get('children')
    async GetProfile(@Req() req:RequestWithUser){
        return await this.appParent.GetProfile(+req.user.userId)
    }

    // Tab trang chủ: buổi học sắp tới, 
    // kết quả gần nhất, số tiền nợ của con 
    @Get('students/:id/dashboard')
    async GetDashboard(@Req() req:RequestWithUser, @Param('id') studentId: number){
        return await this.appParent.GetDashboard(+req.user.userId,+studentId)
    }

    // Tab lịch học lấy danh sách buổi học của học viên

    // Tab học tập: lấy kết quả buổi học đã học, chi tiết kết quả,
    // vẽ biểu đồ 5-7 buổi học gần nhất + tính điểm trung bình

    // Thông báo - notisService
    // Đã đọc - notisService

    // Danh sách hóa đơn của con
    
    // Thông tin chuyển khoản
}