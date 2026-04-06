import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { RemindTeacher } from "./dashboard.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('dashboards')
export class DashboardController {
    constructor(private dashboard: DashboardService) { }

    // lấy tổng học viên đang học 
    // ghi danh mới, lợi nhuận (thu-chi)
    // và số hóa đơn còn hiệu lực đã quá hạn và còn nợ trong tháng
    @Get('sumaries')
    async GetSumaries(@Query() q: { m: number, y: number }) {
        return this.dashboard.GetSumaries(q.m, q.y)
    }

    // lấy dữ liệu thu - chi, ghi danh mới theo tháng để vẽ biểu đồ
    @Get('charts')
    async GetFinaceChart(@Query('year') year?: number) {
        const yearNow = year ? year : new Date().getFullYear()
        const [ghiDanh, lopHoc] = await Promise.all([
            this.dashboard.GetFinaceChart(yearNow), // data cho biểu đồ ghi danh
            this.dashboard.GetHighestRevenue()// biểu đồ doanh thu
        ])
        return {
            GhiDanh: ghiDanh,
            LopHoc: lopHoc
        }
    }

    //lấy danh sách buổi học trong 1 tháng
    @Get('sessions')
    async GetTodaySession(@Query() q: { month: number, year: number }) {
        return await this.dashboard.GetSessionOfMonth(+q.month, +q.year)
    }

    // danh sách việc cần làm: các hóa đơn ACTIVE hết hạn, 
    // các lớp sắp hết buổi học cần tạo thêm, 
    // yêu cầu mở khóa buổi học, các buổi học đã kết thúc 
    // > 48h chưa SUBMITTED
    @Get('tasks')
    async GetTasks() {
        return await this.dashboard.GetPendingSessions()
    }

    // gửi thông báo nhắc nhở giáo viên
    @Post('teachers/:id/reminders')
    async RemindTeacher(
        @Param('id') teacherId: number,
        @Body() body: RemindTeacher) {
        return await this.dashboard.RemindTeacher(+teacherId, body)
    }
}