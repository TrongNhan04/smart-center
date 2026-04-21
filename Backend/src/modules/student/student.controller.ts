import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { StudentService } from "./student.service";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { CreateStudentDTO, QueryStudentDTO, UpdateStudentDTO } from "./student.dto";
import { MustChangePWGuard } from "src/auth/guard/must-change-pw.guard";

@Controller('admin/students')
export class StudentController {
    constructor(private readonly stuService: StudentService) { }

    // thêm học viên
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post()
    async create(@Body() body: CreateStudentDTO) {
        return await this.stuService.create(body)
    }

    // lấy danh sách học viên
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get()
    async getMany(@Query() query: QueryStudentDTO) {
        return await this.stuService.getMany(query)
    }

    // lấy danh sách học viên cho cmb
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get('combobox')
    async getManyForCmb() {
        return await this.stuService.getManyForCmb()
    }

    // xóa mềm học viên
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id/inactive')
    async deleteById(@Param('id') studentId: number) {
        return await this.stuService.deleteById(+studentId)
    }

    // lấy danh sách lớp học viên đang học
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id/classes')
    async getClassesById(@Param('id') studentId: number) {
        return await this.stuService.getClassesById(+studentId)
    }

    // danh sách hóa đơn của học viên
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id/invoices')
    async getInvoicesById(@Param('id') studentId: number) {
        return await this.stuService.getInvoicesById(+studentId)
    }

    // thống kê kết quả học tập 1 lớp mà học viên học
    @UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
    @Roles('ADMIN','TEACHER')
    @Get(':id/classes/:classId')
    async getClassResultById(
        @Param('id') studentId: number,
        @Param('classId') classId: number) {
            return await this.stuService.getClassResultById(+studentId, +classId)
    }

    // lấy chi tiết học viên - phần trên
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id')
    async getOne(@Param('id') studentId: number) {
        return await this.stuService.getOne(+studentId)
    }

    // sửa thông tin học viên
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id')
    async updateById(@Param('id') studentId: number,
        @Body() body: UpdateStudentDTO) {
        return await this.stuService.updateById(+studentId, body)
    }
}