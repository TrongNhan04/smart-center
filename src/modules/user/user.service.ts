import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) { }

  async Profile(userId: number) {
    const userDB = await this.prismaService.user.findUnique({
      where: { ID: userId },
      select: {
        ID: true,
        Email: true,
        DienThoai: true,
        VaiTro: true,
        PhaiDoiMK: true
      }
    })

    if (!userDB)
      throw new UnauthorizedException("User is not exist")

    return userDB
  }
}
