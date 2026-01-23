import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('dashboards')
export class DashboardController {
    constructor(private dashboard: DashboardService) { }

    // lấy tổng học viên, lớp học, ghi danh mới, tổng thu - chi trong tháng
    @Get('sumaries')
    async GetSumary() {
        return this.dashboard.GetSumary()
    }

    // lấy dữ liệu thu - chi, ghi danh mới theo tháng để vẽ biểu đồ
    @Get('charts')
    async GetFinaceChart(@Query('year') year?: number) {
        const yearNow = year ? year : new Date().getFullYear()
        return await this.dashboard.GetFinaceChart(yearNow)
    }

    // lấy danh sách buổi học hôm nay
    @Get('sessions')
    async GetTodaySession() {
        return await this.dashboard.GetTodaySession()
    }

    // danh sách việc cần làm: các hóa đơn hết hạn, 
    // các lớp sắp hết hạn, yêu cầu mở khóa buổi học
    // các buổi học đã kết thúc > 48h chưa SUBMITTED
    @Get('tasks')
    async GetTasks(){
        //return await this.dashboard.GetOverdueInvoices()
        //return await this.dashboard.GetExpiringClasses()
        return await this.dashboard.GetPendingSessions()
    }
}