import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ClassService } from "./class.service";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { QueryClassDTO, UpdateClassDTO, CreateClassDTO } from "./class.dto";
import { MustChangePWGuard } from "src/auth/guard/must-change-pw.guard";
import { SessionService } from "../session/session.service";
import { Request } from 'express';

type RequestWithUser = Request & { user: { userId: number; role?: string } };

@Controller()
export class ClassController {
    constructor(
        private classService: ClassService,
        private sessionService: SessionService
    ) { }
    //================== ADMIN ==================
    // thêm lớp
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('admin/classes')
    async create(@Body() body: CreateClassDTO) {
        return await this.classService.create(body)
    }

    // lấy danh sách lớp hiện có hoặc theo điều kiện - query
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get('admin/classes')
    async getMany(@Query() query: QueryClassDTO) {
        return await this.classService.getMany(query)
    }

    // lấy danh sách lớp cho combobox
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get('admin/classes-combobox')
    async getManyForCmb() {
        return await this.classService.getManyForCmb()
    }

    // cập nhật lớp theo trạng thái
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch('admin/classes/:id')
    async updateById(
        @Param('id') classId: number,
        @Body() body: UpdateClassDTO) {
        return await this.classService.updateById(+classId, body)
    }

    // xóa mềm lớp học
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch('admin/classes/:id/closed')
    async deleteById(@Param('id') classId: number) {
        return await this.classService.deleteById(+classId)
    }

    //  lấy danh sách buổi học của lớp - phần dưới
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @Get('admin/classes/:id/sessions')
    async getSessionsByClassId(
        @Req() req: RequestWithUser,
        @Param('id') classId: number) {
        const userId = req.user.role === 'TEACHER' ? req.user.userId : null
        return await this.sessionService.getManyByClassId(classId, userId)
    }

    // lấy danh sách học viên ACTIVE của lớp
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @Get('admin/classes/:id/students')
    async getStusById(@Param('id') classId: number) {
        return await this.classService.getStusById(+classId)
    }

    // lấy chi tiết lớp - phần trên 
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @Get('admin/classes/:id')
    async getOne(
        @Req() req: RequestWithUser,
        @Param('id') classId: number) {
        const userId = req.user.role === 'TEACHER' ? req.user.userId : null
        return await this.classService.getOne(+classId, userId)
    }

    //======================== TEACHER ========================
    // danh sách lớp giáo viên A đang dạy - xong
    @UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @Get('teachers/classes')
    async getManyByUserId(@Req() req: RequestWithUser) {
        return this.classService.getManyByUserId(req.user.userId)
    }

    // danh sách buổi học của 1 lớp giáo viên A dạy - xong
    @UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @Get('teachers/classes/:id/sessions')
    async getSessionsByUserId(
        @Param('id') classId: number,
        @Req() req: RequestWithUser) {
        const userId = req.user.role === 'ADMIN' ? null : req.user.userId
        if (!userId) throw new NotFoundException('Không tìm thấy giáo viên')
        return await this.sessionService.getManyByUserId(+userId, +classId)
    }

    // lịch dạy của giáo viên - dashboard có
}