/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || Role.STUDENT,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
      },
    });

    // Create instructor profile if role is INSTRUCTOR
    if (role === Role.INSTRUCTOR) {
      await this.prisma.instructorProfile.create({
        data: {
          userId: user.id,
          expertise: [],
        },
      });
    }

    // Generate JWT token
    const token = await this.generateToken(user.id, user.email, user.role);

    return {
      access_token: token,
      user,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = await this.generateToken(user.id, user.email, user.role);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token: token,
      user: userWithoutPassword,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        profileImage: true,
        bio: true,
        createdAt: true,
        instructorProfile: {
          select: {
            expertise: true,
            experience: true,
            website: true,
            socialLinks: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async generateToken(
    userId: string,
    email: string,
    role: Role,
  ): Promise<string> {
    const payload = {
      sub: userId,
      email,
      role,
    };

    return this.jwtService.sign(payload);
  }

  // Email verification methods (for future implementation)
  async verifyEmail(token: string): Promise<{ message: string }> {
    // TODO: Implement email verification logic
    return { message: 'Email verification not implemented yet' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    // TODO: Implement forgot password logic
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // TODO: Send reset password email
    return { message: 'Password reset email sent (not implemented yet)' };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // TODO: Implement reset password logic
    return { message: 'Password reset not implemented yet' };
  }
}
