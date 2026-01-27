import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateTeacherDTO, QueryTeacherDTO, UpdateTeacherDTO } from './teacher.dto';


@Controller('admin/teachers')
export class TeacherController {
  constructor(private teacherService: TeacherService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  async CreateTeacher(@Body() body: CreateTeacherDTO) {
    return await this.teacherService.CreateTeacher(body)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  async GetTeachers(@Query() query: QueryTeacherDTO) {
    return await this.teacherService.GetTeachers(query)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  async GetTeacherByID(@Param('id') teacherId: number) {
    return await this.teacherService.GetTeacherByID(+teacherId)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  async UpdateTeacherByID(@Param('id') teacherId: number,
    @Body() body: UpdateTeacherDTO) {
    return await this.teacherService.UpdateTeacherByID(+teacherId, body)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/inactive')
  async DelateTeacherByID(@Param('id') teacherId: number) {
    return await this.teacherService.DelateTeacherByID(+teacherId)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id/classes')
  async GetClassesByTeacherID(@Param('id') teacherId: number) {
    return await this.teacherService.GetClassesByTeacherID(+teacherId)
  }  
}
