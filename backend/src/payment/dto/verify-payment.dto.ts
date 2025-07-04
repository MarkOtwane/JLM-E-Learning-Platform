import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsString()
  @IsNotEmpty()
  provider: string;
}
