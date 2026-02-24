import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateTeacherDTO, QueryTeacherDTO, UpdateTeacherDTO } from './teacher.dto';


@Controller('admin/teachers')
export class TeacherController {
  constructor(private teacherService: TeacherService) { }

  // thêm giáo viên
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  async CreateTeacher(@Body() body: CreateTeacherDTO) {
    return await this.teacherService.CreateTeacher(body)
  }

  // lấy danh sách giáo viên
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  async GetTeachers(@Query() query: QueryTeacherDTO) {
    return await this.teacherService.GetTeachers(query)
  }

  // lấy chi tiết giáo viên
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  async GetTeacherByID(@Param('id') teacherId: number) {
    return await this.teacherService.GetTeacherByID(+teacherId)
  }

  // cập nhật thông tin giáo viên
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  async UpdateTeacherByID(@Param('id') teacherId: number,
    @Body() body: UpdateTeacherDTO) {
    return await this.teacherService.UpdateTeacherByID(+teacherId, body)
  }

  // xóa mềm giáo viên
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/inactive')
  async DeleteTeacherByID(@Param('id') teacherId: number) {
    return await this.teacherService.DeleteTeacherByID(+teacherId)
  }

  // khôi phục giáo viên
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id/restore')
    async RestoreCourseById(@Param('id') id: number) {
        return await this.teacherService.RestoreTeacherById(+id)
    }

  // danh sách lớp của 1 giáo viên 
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id/classes')
  async GetClassesByTeacherID(@Param('id') teacherId: number) {
    return await this.teacherService.GetClassesByTeacherID(+teacherId)
  }

  //danh sách buổi học đã dạy của giáo viên
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id/sessions-completed')
  async GetCompletedSS(@Param('id') teacherId: number) {
    return await this.teacherService.GetCompletedSS(+teacherId)
  }
}
