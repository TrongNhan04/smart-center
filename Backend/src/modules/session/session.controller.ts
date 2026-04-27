import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { Roles } from "src/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { SessionService } from "./session.service";
import { CreateSessionDTO, UpdateSessionDTO } from "./session.dto";
import { Request } from 'express';
import { MustChangePWGuard } from "src/auth/guard/must-change-pw.guard";
import { SessionsResultDTO } from "../session-result/session-result.dto";
type RequestWithUser = Request & { user: { userId: number; role?: string } };

@Controller()
export class SessionController {
    constructor(private sessionService: SessionService) { }

    // tạo buổi học tự động
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('admin/sessions-auto/classes/:id')
    async autoGenerate(@Param('id') classId: number) {
        return await this.sessionService.autoGenerate(+classId)
    }

    //tạo buổi học thủ công
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('admin/sessions-manual/classes/:id')
    async manualGenerate(
        @Body() body: CreateSessionDTO,
        @Param('id') classId: number) {
        return await this.sessionService.manualGenerate(+classId, body)
    }

    // hủy buổi học: 
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch('admin/sessions/:id/cancel')
    async cancelById(@Param('id') sessionId: number,
        @Body('reason') reason: string) {
        return await this.sessionService.cancelById(+sessionId, reason)
    }

    // thông tin chi tiết 1 buổi học
    @UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @Get('sessions/:id')
    async getOne(
        @Req() req:RequestWithUser,
        @Param('id') sessionId: number) {
        const userId = req.user.role === 'TEACHER'? req.user.userId : null
        return await this.sessionService.getOne(+sessionId, userId)
    }

    // lưu nháp kết quả buổi học - DRAFT
    @UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @Put('teacher/sessions/:id/result-draft')
    async saveDraftResult(
        @Param('id') sessionId: number,
        @Body() body: SessionsResultDTO,
        @Req() req: RequestWithUser) {
        const userId = req.user.role === 'ADMIN' ? null : req.user.userId
        if (!userId) throw new NotFoundException('Teacher not found')
        return await this.sessionService.saveDraftResult(+userId, +sessionId, body)
    }

    // lưu thật kết quả buổi học - SUBMITTED
    @UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @Put('teacher/sessions/:id/result-submit')
    async submittedResult(
        @Param('id') sessionId: number,
        @Body() body: SessionsResultDTO,
        @Req() req: RequestWithUser) {
        const userId = req.user.role === 'ADMIN' ? null : req.user.userId
        if (!userId) throw new NotFoundException('Teacher not found')
        return await this.sessionService.submittedResult(+userId, +sessionId, body)
    }

    // mở khóa lưu kết quả buổi học
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('admin/sessions/:id/unlock')
    async unlockSession(@Param('id') sessionId: number) {
        return await this.sessionService.unlockSession(+sessionId)
    }

    // từ chối mở khóa
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('admin/sessions/:id/refuse-unlock')
    async refuseUnlock(@Param('id') sessionId: number) {
        return await this.sessionService.refuseUnlock(+sessionId)
    }

    // gửi yêu cầu mở khóa buổi học 
    @UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
    @Roles('TEACHER')
    @Post('sessions/:id/request-unlock')
    async requestUnlock(
        @Req() req: RequestWithUser,
        @Param('id') sessionId: number,
        @Body('reason') reason: string) {
        const userId = req.user.userId
        return await this.sessionService.requestUnlock(+userId, +sessionId, reason)
    }
}