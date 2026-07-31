import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import {
  CreateTeacherDTO,
  QueryTeacherDTO,
  UpdateTeacherDTO,
} from './teacher.dto';

@Controller('admin/teachers')
export class TeacherController {
  constructor(private teacherService: TeacherService) {}

  // thêm giáo viên
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  async create(@Body() body: CreateTeacherDTO) {
    return await this.teacherService.create(body);
  }

  // lấy danh sách giáo viên
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  async getMany(@Query() query: QueryTeacherDTO) {
    return await this.teacherService.getMany(query);
  }

  // lấy danh sách giáo viên cho combobox
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('/combobox')
  async getManyForCmb() {
    return await this.teacherService.getManyForCmb();
  }

  // lấy chi tiết giáo viên
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  async getOne(@Param('id') teacherId: number) {
    return await this.teacherService.getOne(+teacherId);
  }

  // cập nhật thông tin giáo viên
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  async updateById(
    @Param('id') teacherId: number,
    @Body() body: UpdateTeacherDTO,
  ) {
    return await this.teacherService.updateById(+teacherId, body);
  }

  // xóa mềm giáo viên
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/inactive')
  async deleteById(@Param('id') teacherId: number) {
    return await this.teacherService.deleteById(+teacherId);
  }

  // khôi phục giáo viên
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/restore')
  async restore(@Param('id') id: number) {
    return await this.teacherService.restore(+id);
  }

  // danh sách lớp của 1 giáo viên
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id/classes')
  async getClassesById(@Param('id') teacherId: number) {
    return await this.teacherService.getClassesById(+teacherId);
  }

  //danh sách buổi học đã dạy của giáo viên
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id/sessions-completed')
  async getCompletedSS(@Param('id') teacherId: number) {
    return await this.teacherService.getCompletedSS(+teacherId);
  }
}
