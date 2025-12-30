import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ClassService } from "./class.service";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { ClassQueryDTO, CreateClassDTO } from "./class.dto";

@Controller('admin/classes')
export class ClassController{
    constructor(private classService: ClassService){}

    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles('ADMIN')
    @Post()
    async CreateClass(@Body() createClassDTO: CreateClassDTO){
        return await this.classService.CreateClass(createClassDTO)
    }

    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles('ADMIN')
    @Get()
    async GetClasses(@Query() query: ClassQueryDTO){
        return await this.classService.GetClasses(query)
    }
}