import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(
    private prismaService: PrismaService
  ){}

  async Profile(req){
    const id = req.user.userId
    const userDB = await this.prismaService.user.findUnique({
      where:{ID: id},
      select:{
        ID: true,
        Email: true,
        VaiTro: true,
        PhaiDoiMK: true
      }
    })

    if(!userDB)
      throw new UnauthorizedException("User is not exist")

    return userDB
  }
  
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
