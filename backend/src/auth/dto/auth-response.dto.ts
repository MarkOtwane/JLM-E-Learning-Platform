import { Role } from '@prisma/client';

export class AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    isEmailVerified: boolean;
  };
}
