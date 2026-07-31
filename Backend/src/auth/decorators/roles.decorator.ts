import { SetMetadata } from '@nestjs/common';
import { Vaitro } from 'src/generated/prisma/enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Vaitro[]) => SetMetadata(ROLES_KEY, roles);