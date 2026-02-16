import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResendVerificationEmailDto {
  @IsString()
  @IsNotEmpty()
  email: string;
}
