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

    // lấy các con số biết nói: số học viên acitve, số lớp running/open
    @Get('sumaries')
    async GetSumary() {
        return this.dashboard.GetSumary()
    }

    // lấy dữ liệu thu - chi theo tháng để vẽ biểu đồ
    @Get('charts')
    async GetChartFinace(@Query() year: string) {
        return this.dashboard.GetChartFinace(year)
    }
}