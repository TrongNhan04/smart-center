import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CourseService } from "./course.service";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { CourseQueryDTO, CourseUpdateDTO, CreateCourseDTO } from "./course.dto";

@Controller('admin/courses')
export class CourseController {
    constructor(
        private courseService: CourseService
    ) { }

    //thêm khóa học
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post()
    async CreateCourse(@Body() courseDTO: CreateCourseDTO) {
        return await this.courseService.CreateCourse(courseDTO)
    }

    // lấy danh sách khóa học hiện có hoặc theo query
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get()
    async GetCourses(@Query() query: CourseQueryDTO) {
        return await this.courseService.GetCourses(query)
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get('/combobox')
    async GetDataForCmb() {
        return await this.courseService.GetDataForCmb()
    }

    // lấy chi tiết 1 khóa học
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id')
    async GetCourseById(@Param('id') id: number) {
        return await this.courseService.GetCourseById(+id) // ép kiểu id sang number
    }

    //sửa khóa học theo trạng thái
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id')
    async UpdateCourseById(@Param('id') id: number,
        @Body() updateCourse: CourseUpdateDTO) {
        return await this.courseService.UpdateCourseById(+id, updateCourse)
    }

    // xóa mềm khóa học
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id/inactive')
    async DeleteCourseByID(@Param('id') id: number) {
        return await this.courseService.DeleteCouresByID(+id)
    }

    // khôi phục khóa học
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id/restore')
    async RestoreCourseById(@Param('id') id: number) {
        return await this.courseService.RestoreCourseById(+id)
    }

    // lấy danh sách lớp thuộc khóa học 
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id/classes')
    async GetClassesByCourseId(@Param('id') courseId: number) {
        return this.courseService.GetClassesByCourseId(+courseId)
    }
}