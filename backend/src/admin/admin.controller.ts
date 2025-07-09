import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

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

  @Delete('users/:id')
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param('id') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  @Delete('courses/:id')
  @Roles(UserRole.ADMIN)
  async deleteCourse(@Param('id') courseId: string) {
    return this.adminService.deleteCourse(courseId);
  }

  @Get('certificates')
  @Roles(UserRole.ADMIN)
  async listCertificates() {
    return this.adminService.listCertificates();
  }

  @Get('courses')
  @Roles(UserRole.ADMIN)
  async listCourses() {
    return this.adminService.listCourses();
  }

  @Get('pending-instructors')
  @Roles(UserRole.ADMIN)
  async listPendingInstructors() {
    return this.adminService.listPendingInstructors();
  }

  @Patch('pending-instructors/:id/accept')
  @Roles(UserRole.ADMIN)
  async approveInstructor(@Param('id') instructorId: string) {
    return this.adminService.approveInstructor(instructorId);
  }

  @Delete('pending-instructors/:id')
  @Roles(UserRole.ADMIN)
  async rejectInstructor(@Param('id') instructorId: string) {
    return this.adminService.rejectInstructor(instructorId);
  }
}
