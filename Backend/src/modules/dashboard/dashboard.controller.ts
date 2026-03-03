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
    async GetSumary(@Query() q:{m:number, y:number}) {
        return this.dashboard.GetSumary(q.m, q.y)
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
    // các lớp sắp hết buổi học cần tạo thêm, 
    // yêu cầu mở khóa buổi học, các buổi học đã kết thúc 
    // > 48h chưa SUBMITTED
    @Get('tasks')
    async GetTasks(){
        const [invoices, classs, sessions] = await Promise.all([
            this.dashboard.GetOverdueInvoices(),
            this.dashboard.GetExpiringClasses(),
            this.dashboard.GetPendingSessions()
        ])
        return {invoices, classs, sessions}
    }
}