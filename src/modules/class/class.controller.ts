import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ClassService } from "./class.service";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { ClassQueryDTO, ClassUpdateDTO, CreateClassDTO } from "./class.dto";
import { CreateSessionDTO, SessionStatusDTO } from "../session/session.dto";
import { MustChangePWGuard } from "src/auth/guard/must-change-pw.guard";

@Controller('admin/classes')
export class ClassController {
    constructor(private classService: ClassService) { }

    // thêm lớp
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post()
    async CreateClass(@Body() createClassDTO: CreateClassDTO) {
        return await this.classService.CreateClass(createClassDTO)
    }

    // lấy danh sách lớp hiện có hoặc theo điều kiện - query
    @UseGuards(JwtAuthGuard, MustChangePWGuard,RolesGuard)
    @Roles('ADMIN','TEACHER')
    @Get()
    async GetClasses(@Query() query: ClassQueryDTO) {
        return await this.classService.GetClasses(query)
    }

    // lấy chi tiết lớp - phần trên 
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id')
    async GetClassById(@Param('id') classId: number) {
        return await this.classService.GetClassById(+classId)
    }

    // cập nhật lớp theo trạng thái
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id')
    async UpdateClassById(@Param('id') classId: number,
        @Body() body: ClassUpdateDTO) {
        return await this.classService.UpdateClassById(+classId, body)
    }

    // xóa mềm lớp học
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id/closed')
    async DeleteClassByID(@Param('id') classId: number) {
        return await this.classService.DeleteClassByID(+classId)
    }

    //  lấy danh sách buổi học của lớp - phần dưới
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id/sessions')
    async GetSessionsByClassId(@Param('id') classId: number,
        @Query() query: SessionStatusDTO) {
        return await this.classService.GetSessionsByClassId(+classId, query)
    }

    // tạo buổi học tự động
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post(':id/sessions/auto')
    async AutoGenerateSession(@Param('id') classId: number) {
        return await this.classService.AutoGenerateSession(+classId)
    }

    //tạo buổi học thủ công
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post(':id/sessions/manual')
    async ManualGenerateSession(@Param('id') classId: number,
        @Body() body: CreateSessionDTO) {
            return await this.classService.ManualGenerateSession(+classId, body)
    }
}