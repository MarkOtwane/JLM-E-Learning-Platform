import { IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class FilterUsersDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
