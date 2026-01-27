import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AppParentService } from "./app-parent.service";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { MustChangePWGuard } from "src/auth/guard/must-change-pw.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { Request } from 'express';
import { Pagination } from "../session/session.dto";

type RequestWithUser = Request & { user: { userId: number; role?: string } };

@UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
@Roles('ADMIN', 'PARENT', 'TEACHER')
@Controller('parents')
export class AppParentController {
    constructor(
        private appParent: AppParentService
    ) { }
    // đăng xuất | đăng nhập - auth service
    // đổi tên | mật khẩu - auth service

    // lấy thông tin tài khoản + danh sách con
    @Get('children')
    async GetProfile(@Req() req: RequestWithUser) {
        return await this.appParent.GetProfile(+req.user.userId)
    }

    // Tab trang chủ: buổi học sắp tới, 
    // kết quả gần nhất, số hóa đơn nợ của con 
    @Get('students/:id/dashboard')
    async GetDashboard(@Req() req: RequestWithUser,
        @Param('id') studentId: number) {
        return await this.appParent.GetDashboard(+req.user.userId, +studentId)
    }

    // Tab lịch học lấy danh sách buổi học của con
    @Get('students/:id/sessions')
    async GetSessionByStudentID(@Req() req: RequestWithUser,
        @Param('id') studentId: number,
        @Query() p: Pagination) {
        return await this.appParent.GetSessionByStudentID(
            +req.user.userId, studentId, p
        )
    }

    // Tab học tập: biểu đồ điểm 5-7 buổi gần nhất 
    // điểm trung bình + chuyên cần 
    @Get('students/:id/result-sumaries')
    async GetResultSumary(@Req() req: RequestWithUser,
        @Param('id') studentId: number) {
        const userId = req.user.userId
        return await this.appParent.GetResultSumary(+userId, studentId)
    }

    // Tab học tập: lịch sử buổi học gồm ngày, lớp, chủ đề, điểm
    @Get('students/:id/session-results')
    async GetSessionResults(@Req() req: RequestWithUser,
        @Param('id') studentId: number,
        @Query() p: Pagination) {
        const userId = req.user.userId
        return await this.appParent.GetSessionResults(+userId, studentId, p)
    }

    // Tab học tập: xem chi tiết 1 buổi học
    @Get('students/:sdId/sessions/:ssId')
    async GetSessionDetail(@Req() req: RequestWithUser,
        @Param('sdId') studentId: number,
        @Param('ssId') sessionId: number) {
        const userId = req.user.userId
        return await this.appParent.GetSessionDetail(+userId, +studentId, +sessionId)
    }

    // Thông báo - notisService
    // Đã đọc - notisService

    // Danh sách hóa đơn của con
    @Get('students/:id/invoices')
    async GetInvoiceByStudentID(@Req() req: RequestWithUser,
        @Param('id') studentId: number) {
        const userId = req.user.userId
        return await this.appParent.GetInvoiceByStudentID(+userId, studentId)
    }

    // Thông tin chuyển khoản
}