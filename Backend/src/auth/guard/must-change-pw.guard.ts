import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class MustChangePWGuard implements CanActivate {
    constructor(private prismaService: PrismaService) { }

    async canActivate(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest()

        const userId = req.user?.userId;
        if (!userId) throw new UnauthorizedException('Missing JWT payload')

        const userDB = await this.prismaService.user.findUnique({
            where: { ID: userId },
            select: { PhaiDoiMK: true, VaiTro:true },
        });

        if (!userDB?.PhaiDoiMK || userDB?.VaiTro === 'ADMIN') return true

        const url = req.originalUrl
        const method = req.method

        const allowed =
            (method === 'POST' && url.startsWith('/auth/password')) ||
            (method === 'GET' && url.startsWith('/users/me'));

        if (allowed) return true;

        throw new ForbiddenException('Vui lòng đổi mật khẩu một lần vì lý do bảo mật')
    }

}