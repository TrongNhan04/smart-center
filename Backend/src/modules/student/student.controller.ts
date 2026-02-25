import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { StudentService } from "./student.service";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { CreateStudentDTO, QueryStudentDTO, UpdateStudentDTO } from "./student.dto";

@Controller('admin/students')
export class StudentController {
    constructor(private studentService: StudentService) { }

    // thêm học viên
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post()
    async CreateStudent(@Body() body: CreateStudentDTO) {
        return await this.studentService.CreateStudent(body)
    }

    // lấy danh sách học viên
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get()
    async GetStudents(@Query() query: QueryStudentDTO) {
        return await this.studentService.GetStudents(query)
    }

    // lấy chi tiết học viên - phần trên
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id')
    async GetStudentByID(@Param('id') studentId: number) {
        return await this.studentService.GetStudentByID(+studentId)
    }

    // sửa thông tin học viên
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id')
    async UpdateStudentByID(@Param('id') studentId: number,
        @Body() body: UpdateStudentDTO) {
        return await this.studentService.UpdateStudentByID(+studentId, body)
    }

    // xóa mềm học viên
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id/inactive')
    async DelateStudentByID(@Param('id') studentId: number) {
        return await this.studentService.DeleteStudentByID(+studentId)
    }

    // lấy danh sách lớp học viên đang học
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id/classes')
    async GetClassesByStudentId(@Param('id') studentId: number) {
        return await this.studentService.GetClassesByStudentID(+studentId)
    }

    // lấy danh sách buổi học đã học 
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id/sessions-completed')
    async GetCompletedSS(@Param('id') studentId: number) {
        return await this.studentService.GetCompletedSS(+studentId)
    }
}