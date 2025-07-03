import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class BulkEnrollDto {
  @IsUUID(4, { each: true })
  studentIds: string[];

  @IsUUID()
  courseId: string;

  @IsBoolean()
  @IsOptional()
  sendNotification?: boolean;
}
