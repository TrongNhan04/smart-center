import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ClassService } from "./class.service";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { QueryClassDTO, UpdateClassDTO, CreateClassDTO, SchechuleDTO } from "./class.dto";
import { SessionStatusDTO } from "../session/session.dto";
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
    async CreateClass(@Body() createClassDTO: CreateClassDTO) {
        return await this.classService.CreateClass(createClassDTO)
    }

    // lấy danh sách lớp hiện có hoặc theo điều kiện - query
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get('admin/classes')
    async GetClasses(@Query() query: QueryClassDTO) {
        return await this.classService.GetClasses(query)
    }

    // lấy chi tiết lớp - phần trên 
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get('admin/classes/:id')
    async GetClassById(@Param('id') classId: number) {
        return await this.classService.GetClassById(+classId)
    }

    // cập nhật lớp theo trạng thái
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch('admin/classes/:id')
    async UpdateClassById(@Param('id') classId: number,
        @Body() body: UpdateClassDTO) {
        return await this.classService.UpdateClassById(+classId, body)
    }

    // xóa mềm lớp học
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch('admin/classes/:id/closed')
    async DeleteClassByID(@Param('id') classId: number) {
        return await this.classService.DeleteClassByID(+classId)
    }

    //  lấy danh sách buổi học của lớp - phần dưới
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get('admin/classes/:id/sessions')
    async GetSessionsByClassId(@Param('id') classId: number,
        @Query() query: SessionStatusDTO) {
        return await this.sessionService.GetSessionsByClassId(classId, query)
    }

    // tạo buổi học tự động
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('admin/classes/:id/sessions-auto')
    async AutoGenerateSession(@Param('id') classId: number) {
        return await this.sessionService.AutoGenerateSession(+classId)
    }

    //======================== TEACHER ========================
    // danh sách lớp giáo viên A đang dạy - xong
    @UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @Get('teachers/classes')
    async GetClassesByTeacherId(@Req() req: RequestWithUser) {
        return this.classService.GetClassesByTeacherId(req.user.userId)
    }

    // danh sách buổi học của 1 lớp giáo viên A dạy - xong
    @UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @Get('teachers/classes/:id/sessions')
    async GetSessionsByTeacherId(
        @Param('id') classId: number,
        @Req() req: RequestWithUser) {
        const userId = req.user.role === 'ADMIN' ? null : req.user.userId
        if (!userId) throw new NotFoundException('Teacher not found')
        return await this.sessionService.GetSessionsByTeacherId(+userId, +classId)
    }
    
    // lịch dạy của giáo viên
    @UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @Get('teachers/sessions-week')
    async GetSessionsOneWeek(@Req() req: RequestWithUser,
        @Query() q:SchechuleDTO) {
        const userId = req.user.role === 'ADMIN' ? null : req.user.userId
        if (!userId) throw new NotFoundException('Teacher not found')
        return await this.sessionService.GetSessionsOneWeek(+userId, q.startDate, q.endDate)
    }
}