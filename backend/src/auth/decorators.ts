/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

// Role-based access decorator
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// Get currently authenticated user
export const User = createParamDecorator(
  (data: keyof Express.User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

/**
 * 👤 @User()

Extract the current user or a specific property from the request:

@User() user: User
@User('email') email: string
 */

/**
 * 🔐 @Roles(...)

Attach allowed roles to a route:

@Roles(UserRole.ADMIN)

Used with RolesGuard to restrict access.
 */

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
