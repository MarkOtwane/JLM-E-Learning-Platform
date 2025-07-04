import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators';
import { UserRole } from '@prisma/client';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { FilterUsersDto } from './dto/filter-users.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles(UserRole.ADMIN)
  async listUsers(@Query() filter: FilterUsersDto) {
    return this.adminService.listUsers(filter);
  }

  @Post('users/update-role')
  @Roles(UserRole.ADMIN)
  async updateUserRole(@Body() dto: UpdateUserRoleDto) {
    return this.adminService.updateUserRole(dto);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getPlatformStats() {
    return this.adminService.getPlatformStats();
  }
}
