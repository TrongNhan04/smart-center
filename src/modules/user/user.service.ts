import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProfileDTO } from './user.dto';
import * as bcrypt from 'bcrypt'
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class UserService {
	constructor(private prismaService: PrismaService) { }

	async GetMe(userId: number) {
		const userDB = await this.prismaService.user.findUnique({
			where: { ID: userId },
			select: {
				ID: true,
				HoTen: true,
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

	// đổi tên + mật khẩu
	async UpdateProfile(userID: number, profile: ProfileDTO) {
		const userDB = await this.prismaService.user.findUnique({
			where: { ID: userID }
		})
		if (!userDB)
			throw new NotFoundException("User not found")

		const data: Prisma.UserUpdateInput = {}
		if (profile.userName)
			data.HoTen = profile.userName.trim()

		if (profile.newPassword && profile.oldPassword) {
			const comparePW = await bcrypt.compare(profile.oldPassword, userDB.MatKhauHash)
			if (!comparePW)
				throw new UnauthorizedException("Incorrect password!")

			if (profile.oldPassword === profile.newPassword)
				throw new BadRequestException("Password doesn't change!")

			const hashPW = await bcrypt.hash(profile.newPassword, 10)
			data.MatKhauHash = hashPW
			data.PhaiDoiMK = false
			data.ToKenVerSion = { increment: 1 }
		}

		await this.prismaService.user.update({
			where: { ID: userID },
			data
		})
		return { mgs: "Update succesfully" }
	}
}
