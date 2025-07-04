import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  MPESA = 'MPESA',
}

export class InitiatePaymentDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsString()
  @IsNotEmpty()
  phoneOrEmail: string; // phone for M-Pesa, email for Stripe
}
