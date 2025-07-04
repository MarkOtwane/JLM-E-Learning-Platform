import { IsNotEmpty, IsString } from 'class-validator';

export class RequestCertificateDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;
}
