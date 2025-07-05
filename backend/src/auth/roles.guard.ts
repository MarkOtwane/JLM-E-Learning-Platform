/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// src/auth/roles.guard.ts

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // no roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('=== ROLES GUARD DEBUG ===');
    console.log('Required roles:', requiredRoles);
    console.log('User object:', JSON.stringify(user, null, 2));
    console.log('User role:', user?.role);
    console.log('User role type:', typeof user?.role);
    console.log('Required roles types:', requiredRoles.map(r => typeof r));
    console.log('Includes check:', requiredRoles.includes(user?.role));
    console.log('=== END DEBUG ===');

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Access denied: insufficient role');
    }

    return true;
  }
}
