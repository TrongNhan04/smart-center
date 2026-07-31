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
import { CourseService } from './course.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CourseQueryDTO, CourseUpdateDTO, CreateCourseDTO } from './course.dto';

@Controller('admin/courses')
export class CourseController {
  constructor(private courseService: CourseService) {}

  //thêm khóa học
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  async create(@Body() body: CreateCourseDTO) {
    return await this.courseService.create(body);
  }

  // lấy danh sách khóa học hiện có hoặc theo query
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  async getMany(@Query() query: CourseQueryDTO) {
    return await this.courseService.getMany(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('/combobox')
  async getManyForCmb() {
    return await this.courseService.getManyForCmb();
  }

  // lấy chi tiết 1 khóa học
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  async getOne(@Param('id') id: number) {
    return await this.courseService.getOne(+id); // ép kiểu id sang number
  }

  //sửa khóa học theo trạng thái
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  async updateById(
    @Param('id') id: number,
    @Body() updateCourse: CourseUpdateDTO,
  ) {
    return await this.courseService.updateById(+id, updateCourse);
  }

  // xóa mềm khóa học
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/inactive')
  async deleteById(@Param('id') id: number) {
    return await this.courseService.deleteById(+id);
  }

  // khôi phục khóa học
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/restore')
  async restore(@Param('id') id: number) {
    return await this.courseService.restore(+id);
  }

  // lấy danh sách lớp thuộc khóa học
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id/classes')
  async getClassesById(@Param('id') courseId: number) {
    return this.courseService.getClassesById(+courseId);
  }
}
