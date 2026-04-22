import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { EnrollService } from "./enroll.service";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { CreateEnrollDTO, QueryEnrollDTO } from "./enroll.dto";

@Controller('admin/enrolls')
export class EnrollController {
    constructor(private enrollService: EnrollService) { }
    
    // thêm ghi danh thủ công
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post()
    async create(@Body() body: CreateEnrollDTO) {
        return await this.enrollService.create(body)
    }

    // lấy danh sách học viên ghi danh
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get()
    async getMany(@Query() query: QueryEnrollDTO) {
        return await this.enrollService.getMany(query)
    }

    // xóa mềm ghi danh
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id/inactive')
    async deleteById(@Param('id') StudentId: number) {
       return await this.enrollService.deleteById(+StudentId)
    }
}