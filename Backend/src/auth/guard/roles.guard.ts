import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private refletor: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const allowedRoles = this.refletor.getAllAndOverride<string[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        // không khai báo @Role thì bỏ qua
        if (!allowedRoles || allowedRoles.length === 0) return true

        //Lấy user từ request đã được JwtAuthGuard gắn vào
        const req = context.switchToHttp().getRequest()
        const user = req.user

        //không có role: chưa đăng nhập, guard không chạy,.. --> chặn
        if(!user?.role) throw new ForbiddenException("Không có quyền truy cập")
        
        //không có role trong danh sánh --> chặn
        if(!allowedRoles.includes(user.role)) throw new ForbiddenException("Không có quyền truy cập")

        // hợp lệ hết thì cho qua
        return true; 
    }
}

