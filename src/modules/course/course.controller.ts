import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CourseService } from "./course.service";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { CoursesDTO, CreateCourseDTO, UpdateCourseDTO } from "./course.dto";

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

    // lấy danh sách khóa học
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get()
    async GetCourses(@Query() query: CoursesDTO) {
        return await this.courseService.GetCourses(query)
    }

    // lấy chi tiết khóa học
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id')
    async GetCourseById(@Param('id') id: number) {
        return await this.courseService.GetCourseById(+id) // ép kiểu id sang number
    }

    //sửa khóa học
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id')
    async UpdateCourseById(@Param('id') id: number,
        @Body() updateCourse: UpdateCourseDTO) {
        return await this.courseService.UpdateCourseById(+id, updateCourse)
    }

    // xóa mềm khóa học
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id/inactive')
    async DeleteCourseById(@Param('id') id: number){
        return await this.courseService.DeleteCouresByID(+id)
    }
}