import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppParentService } from './app-parent.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { MustChangePWGuard } from 'src/auth/guard/must-change-pw.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Request } from 'express';
import { Pagination } from '../session/session.dto';

type RequestWithUser = Request & { user: { userId: number; role?: string } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'PARENT', 'TEACHER')
@Controller('parents')
export class AppParentController {
  constructor(private appParent: AppParentService) {}
  // đăng xuất | đăng nhập - auth service
  // đổi tên | mật khẩu - auth service

  // Tab trang chủ: buổi học sắp tới,
  // kết quả gần nhất, số hóa đơn nợ của con
  @Get('students/:id/dashboard')
  async GetDashboard(
    @Req() req: RequestWithUser,
    @Param('id') studentId: number,
  ) {
    return await this.appParent.GetDashboard(+req.user.userId, +studentId);
  }

  // Tab lớp học: lấy danh sách lớp học của con
  @Get('students/:id/classes')
  async GetClassesByStuId(
    @Req() req: RequestWithUser,
    @Param('id') studentId: number,
  ) {
    const userId = req.user.userId;
    return await this.appParent.GetClassesByStuId(+userId, +studentId);
  }

  // Tab học tập: xem chi tiết 1 buổi học
  @Get('students/:sdId/sessions/:ssId')
  async GetSessionDetail(
    @Req() req: RequestWithUser,
    @Param('sdId') studentId: number,
    @Param('ssId') sessionId: number,
  ) {
    const userId = req.user.userId;
    return await this.appParent.GetSessionDetail(
      +userId,
      +studentId,
      +sessionId,
    );
  }

  // lấy danh sách id buổi học của lớp
  @Get('classes/:id/sessions')
  async GetSessionIdsByClassId(@Param('id') classId: number) {
    return this.appParent.GetSessionIdsByClassId(+classId);
  }

  // Danh sách hóa đơn của con
  @Get('students/:id/invoices')
  async GetInvoiceByStudentID(
    @Req() req: RequestWithUser,
    @Param('id') studentId: number,
  ) {
    const userId = req.user.userId;
    return await this.appParent.GetInvoiceByStudentID(+userId, studentId);
  }

  // lấy 1 hóa đơn
  @Get('invoices/:id')
  async GetInvoiceById(@Param('id') id: number) {
    return this.appParent.GetInvoiceById(+id);
  }
}
